import { useRef, useState, useCallback } from "react";
import { VOLC_SPEECH } from "@/config";

function createMessageId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"];
  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",")[1] ?? "";
        resolve(base64);
        return;
      }
      reject(new Error("无法读取音频内容"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("读取音频失败"));
    reader.readAsDataURL(blob);
  });
}

function logSilentError(message: string, error?: unknown) {
  if (error) {
    console.warn(`[AI语音] ${message}`, error);
    return;
  }
  console.warn(`[AI语音] ${message}`);
}

export interface VoiceRecorderState {
  isRecording: boolean;
  isRecognizing: boolean;
}

export interface VoiceRecorderActions {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => void;
}

export interface VoiceRecorderResult {
  state: VoiceRecorderState;
  actions: VoiceRecorderActions;
  recognizedText: string | null;
  clearRecognizedText: () => void;
}

export function useVoiceRecorder(): VoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    if (!VOLC_SPEECH.appId || !VOLC_SPEECH.accessToken) {
      logSilentError("未配置火山语音识别信息");
      return;
    }

    setIsRecognizing(true);
    try {
      const base64Data = await blobToBase64(audioBlob);
      const response = await fetch(VOLC_SPEECH.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-App-Key": VOLC_SPEECH.appId,
          "X-Api-Access-Key": VOLC_SPEECH.accessToken,
          "X-Api-Resource-Id": VOLC_SPEECH.resourceId,
          "X-Api-Request-Id": createMessageId(),
          "X-Api-Sequence": "-1",
        },
        body: JSON.stringify({
          user: {
            uid: VOLC_SPEECH.appId,
          },
          audio: {
            data: base64Data,
          },
          request: {
            model_name: "bigmodel",
          },
        }),
      });

      const statusCode = response.headers.get("X-Api-Status-Code") ?? "";
      if (!response.ok || statusCode !== "20000000") {
        logSilentError(`语音识别失败：${statusCode || response.status.toString()}`);
        return;
      }

      const payload = (await response.json()) as {
        result?: { text?: string };
      };
      const text = payload?.result?.text?.trim() ?? "";
      if (!text) {
        logSilentError("语音识别未返回文本");
        return;
      }

      setRecognizedText(text);
    } catch (error) {
      logSilentError("语音识别失败", error);
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      logSilentError("当前浏览器不支持录音功能");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mimeType = getSupportedAudioMimeType();
      const mediaRecorder =
        mimeType === "" ? new MediaRecorder(stream) : new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        logSilentError("录音失败，请检查麦克风权限");
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        const audioBlob = new Blob(recordingChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        recordingChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        if (audioBlob.size === 0) {
          logSilentError("录音内容为空");
          return;
        }
        void transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      logSilentError("无法访问麦克风，请检查权限设置", error);
    }
  }, [transcribeAudio]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (isRecognizing) return;
    void startRecording();
  }, [isRecording, isRecognizing, startRecording, stopRecording]);

  const clearRecognizedText = useCallback(() => {
    setRecognizedText(null);
  }, []);

  return {
    state: {
      isRecording,
      isRecognizing,
    },
    actions: {
      startRecording,
      stopRecording,
      toggleRecording,
    },
    recognizedText,
    clearRecognizedText,
  };
}
