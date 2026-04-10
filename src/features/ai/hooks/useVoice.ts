import { useRef, useState, useCallback } from "react";
import { VOLC_SPEECH } from "@/config";
import { createMessageId } from "@/lib/utils";
import { logSilentError } from "@/lib/log";

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

/**
 * 将 Blob 转换为 base64 编码的字符串。
 *
 * @param blob - 要转换的音频 Blob
 * @returns Promise，resolve 为 base64 字符串（不含 data URL 前缀）
 * @throws 无法读取时抛出错误
 */
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

/**
 * 语音录制 Hook，使用 Web Audio API 和火山语音识别。
 * 支持开始/停止/切换录音和自动转写。
 *
 * @returns 语音录制状态、动作和识别文本
 */
export function useVoice(): VoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  /**
   * 将音频 Blob 发送到火山语音 API 进行转写。
   * 成功时设置识别文本，失败时静默记录错误。
   *
   * @param audioBlob - 要转写的录音 Blob
   */
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    if (!VOLC_SPEECH.appId || !VOLC_SPEECH.accessToken) {
      logSilentError("[AI语音]", "未配置火山语音识别信息");
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
        logSilentError("[AI语音]", `语音识别失败：${statusCode || response.status.toString()}`);
        return;
      }

      const payload = (await response.json()) as {
        result?: { text?: string };
      };
      const text = payload?.result?.text?.trim() ?? "";
      if (!text) {
        logSilentError("[AI语音]", "语音识别未返回文本");
        return;
      }

      setRecognizedText(text);
    } catch (error) {
      logSilentError("[AI语音]", "语音识别失败", error);
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  /**
   * 请求麦克风权限并开始录音。
   * 录音停止时自动转写音频。
   */
  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      logSilentError("[AI语音]", "当前浏览器不支持录音功能");
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
        logSilentError("[AI语音]", "录音失败，请检查麦克风权限");
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
          logSilentError("[AI语音]", "录音内容为空");
          return;
        }
        void transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      logSilentError("[AI语音]", "无法访问麦克风，请检查权限设置", error);
    }
  }, [transcribeAudio]);

  /**
   * 停止当前录音（如果正在录音）。
   * 会触发 onstop 处理器，进而调用 transcribeAudio。
   */
  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  /**
   * 切换录音状态。正在录音则停止，空闲则开始。
   * 如果正在识别中则不执行任何操作。
   */
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (isRecognizing) return;
    void startRecording();
  }, [isRecording, isRecognizing, startRecording, stopRecording]);

  /**
   * 清除当前识别的文本。
   */
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
