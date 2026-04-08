import { useEffect, useMemo, useRef, useState } from "react";
import { VOLC_SPEECH } from "@/config";
import { useProject } from "@/hooks/useProject";
import { useParams } from "react-router-dom";
import {
  getProjectCoreGraph,
  getProjectCostCurve,
  getProjectHeadcountCurve,
} from "@/services/schedulepro-service";
import {
  chatWithAgentStream,
  resumeAgentStream,
  extractChatMessageContent,
} from "@/services/ai-service";
import { useQueryClient } from "@tanstack/react-query";

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

function createMessageId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createRequestId() {
  return createMessageId();
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

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
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

type ChatPanelOptions = {
  projectId?: string;
};

export function useChatPanel(options: ChatPanelOptions = {}) {
  const { id: routeProjectId } = useParams();
  const { currentProject, projects, setCoreGraph } = useProject();
  const queryClient = useQueryClient();
  const defaultWelcomeMessage: ChatMessage = useMemo(
    () => ({
      id: createMessageId(),
      content: "您好！我是 AI 助手，您可以输入施工相关问题或调整指令。",
      sender: "ai",
      timestamp: new Date(),
    }),
    [],
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      ...defaultWelcomeMessage,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const threadIdRef = useRef<string | null>(null);
  const threadIdByProjectRef = useRef<Record<string, string | null>>({});
  const messagesByProjectRef = useRef<Record<string, ChatMessage[]>>({});
  const latestMessagesRef = useRef<ChatMessage[]>(messages);
  const lastProjectKeyRef = useRef<string>("");
  const lastContentRef = useRef<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const activeProjectKey = useMemo(
    () => options.projectId || routeProjectId || currentProject?.id || "__default__",
    [options.projectId, routeProjectId, currentProject?.id],
  );

  const resolveProjectId = async (projectRef: string) => {
    if (!projectRef) return "";
    const directMatch = projects.find((project) => project.id === projectRef);
    if (directMatch) return directMatch.id;
    return projectRef;
  };

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }, [messages, isThinking]);

  useEffect(() => {
    const lastKey = lastProjectKeyRef.current;
    if (lastKey && lastKey !== activeProjectKey) {
      messagesByProjectRef.current[lastKey] = latestMessagesRef.current;
      threadIdByProjectRef.current[lastKey] = threadIdRef.current;
    }

    const nextMessages = messagesByProjectRef.current[activeProjectKey];
    setMessages(nextMessages?.length ? nextMessages : [{ ...defaultWelcomeMessage }]);
    threadIdRef.current = threadIdByProjectRef.current[activeProjectKey] ?? null;
    lastContentRef.current = "";
    setInputMessage("");
    setIsThinking(false);
    lastProjectKeyRef.current = activeProjectKey;
  }, [activeProjectKey, defaultWelcomeMessage]);

  useEffect(() => {
    messagesByProjectRef.current[activeProjectKey] = messages;
    latestMessagesRef.current = messages;
  }, [activeProjectKey, messages]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const refreshCoreGraph = async (projectId: string) => {
    const [coreGraph, costCurve, headcountCurve] = await Promise.all([
      getProjectCoreGraph(projectId),
      getProjectCostCurve(projectId),
      getProjectHeadcountCurve(projectId),
    ]);
    setCoreGraph(projectId, coreGraph);
    queryClient.setQueryData(["overview", "cost-curve", projectId], costCurve);
    queryClient.setQueryData(["overview", "headcount-curve", projectId], headcountCurve);
  };

  const resumeInterrupt = async (message: string, approved: boolean) => {
    if (!threadIdRef.current) {
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    const aiMessageId = createMessageId();
    lastContentRef.current = "";
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        content: "",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
    setIsThinking(true);

    try {
      await resumeAgentStream(
        {
          message,
          approved,
          thread_id: threadIdRef.current,
        },
        {
          signal: abortRef.current.signal,
          onMessage: (payload) => {
            const { content } = extractChatMessageContent(payload);
            if (content && content.length >= lastContentRef.current.length) {
              lastContentRef.current = content;
              setMessages((prev) =>
                prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content } : msg)),
              );
            }
          },
          onDone: () => {
            setIsThinking(false);
          },
          onError: (error) => {
            if (error.name === "AbortError") {
              return;
            }
            logSilentError("AI 服务连接失败", error);
            setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
            setIsThinking(false);
          },
        },
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      logSilentError("AI 服务连接失败", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
      setIsThinking(false);
    }
  };

  const sendMessage = async (messageText: string) => {
    const userMessage: ChatMessage = {
      id: createMessageId(),
      content: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    if (!threadIdRef.current) {
      threadIdRef.current = `thread-${createMessageId()}`;
      threadIdByProjectRef.current[activeProjectKey] = threadIdRef.current;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    const aiMessageId = createMessageId();
    lastContentRef.current = "";
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        content: "",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);

    try {
      await chatWithAgentStream(
        {
          message: messageText,
          thread_id: threadIdRef.current,
        },
        {
          signal: abortRef.current.signal,
          onMessage: (payload) => {
            const { content, shouldRefetch } = extractChatMessageContent(payload);

            // 处理 refetch 事件
            if (shouldRefetch) {
              const projectRef = options.projectId || routeProjectId || currentProject?.id || "";
              if (projectRef) {
                void (async () => {
                  const projectId = await resolveProjectId(projectRef);
                  if (projectId) {
                    await refreshCoreGraph(projectId);
                  }
                })();
              }
              return;
            }

            // 更新消息内容
            if (content && content.length >= lastContentRef.current.length) {
              lastContentRef.current = content;
              setMessages((prev) =>
                prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content } : msg)),
              );
            }
          },
          onDone: () => {
            setIsThinking(false);
          },
          onError: (error) => {
            if (error.name === "AbortError") {
              return;
            }
            logSilentError("AI 服务连接失败", error);
            setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
            setIsThinking(false);
          },
        },
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      logSilentError("AI 服务连接失败", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
      setIsThinking(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;
    setInputMessage("");
    await sendMessage(trimmed);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
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
          "X-Api-Request-Id": createRequestId(),
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

      setInputMessage(text);
    } catch (error) {
      logSilentError("语音识别失败", error);
    } finally {
      setIsRecognizing(false);
    }
  };

  const startRecording = async () => {
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
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (isRecognizing) return;
    void startRecording();
  };

  const handleInputEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSendMessage();
    }
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    isThinking,
    isRecording,
    isRecognizing,
    handleSendMessage,
    sendQuickMessage: sendMessage,
    resumeInterrupt,
    handleInputEnter,
    toggleRecording,
    scrollAreaRef,
  };
}

export type ChatPanelState = ReturnType<typeof useChatPanel>;
