import { useEffect, useMemo, useRef, useState } from "react";
import { AI_SSE_URL, VOLC_SPEECH } from "@/config";
import { useAuth } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProject";
import { useParams } from "react-router-dom";
import {
  getProjectCoreGraph,
  getProjectCostCurve,
  getProjectHeadcountCurve,
} from "@/services/schedulepro-service";
import { resumeAgentStream } from "@/services/ai-service";
import { useQueryClient } from "@tanstack/react-query";

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const UNEXPECTED_EVENT_PREFIX = "__unexpected_event__:";

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
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
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
    // eslint-disable-next-line no-console
    console.warn(`[AI语音] ${message}`, error);
    return;
  }
  // eslint-disable-next-line no-console
  console.warn(`[AI语音] ${message}`);
}

type ChatPanelOptions = {
  projectId?: string;
};

export function useChatPanel(options: ChatPanelOptions = {}) {
  const { id: routeProjectId } = useParams();
  const { token } = useAuth();
  const { currentProject, setCoreGraph } = useProject();
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
  const lastProjectKeyRef = useRef<string>("");
  const lastContentRef = useRef<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const activeProjectKey = useMemo(
    () => options.projectId || routeProjectId || currentProject?.id || "__default__",
    [options.projectId, routeProjectId, currentProject?.id],
  );

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }, [messages, isThinking]);

  useEffect(() => {
    const lastKey = lastProjectKeyRef.current;
    if (lastKey && lastKey !== activeProjectKey) {
      messagesByProjectRef.current[lastKey] = messages;
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
        recordingStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const appendAIMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        content,
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };

  const buildVerifyMessage = (data: unknown) => {
    if (!data || typeof data !== "object") {
      return "";
    }
    const payload = data as Record<string, unknown>;
    const verifyType = (payload.verify_type as string) ?? "unknown";
    if (verifyType === "unexpected_event") {
      return `${UNEXPECTED_EVENT_PREFIX}${JSON.stringify(payload)}`;
    }
    const lines: string[] = [];
    if (verifyType === "adjust_project") {
      lines.push("类型：项目工期调整验证");
      if (payload.target_date) lines.push(`目标日期：${payload.target_date}`);
      if (payload.finish_date) lines.push(`完成日期：${payload.finish_date}`);
    } else if (verifyType === "adjust_task") {
      lines.push("类型：任务工期调整验证");
      if (payload.task_name) lines.push(`任务名称：${payload.task_name}`);
      if (payload.finish_date) lines.push(`完成日期：${payload.finish_date}`);
    } else if (verifyType === "unexpected_event") {
      lines.push("类型：突发事件验证");
      if (payload.intent) lines.push(`意图：${payload.intent}`);
      if (payload.affected_task_ids) {
        lines.push(`受影响任务：${JSON.stringify(payload.affected_task_ids)}`);
      }
    } else {
      lines.push(`类型：${verifyType}`);
      lines.push(`数据：${JSON.stringify(payload)}`);
    }
    return lines.join("\n");
  };

  const extractContent = (payload: unknown) => {
    const obj =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : null;
    if (!obj) return null;

    if (obj.type === "refetch") {
      const projectId =
        options.projectId || routeProjectId || currentProject?.id || "";
      if (projectId && token) {
        void refreshCoreGraph(projectId);
      }
      return null;
    }

    if (obj.type === "verify") {
      return buildVerifyMessage(obj.data);
    }

    if (obj.type === "update") {
      if (typeof obj.message === "string") return obj.message;
      if (typeof obj.data === "string") return obj.data;
      if (obj.data && typeof obj.data === "object") {
        const dataObj = obj.data as Record<string, unknown>;
        const routeObj =
          (dataObj.project_info_query as
            | { messages?: Array<{ content?: string; type?: string }> }
            | undefined) ??
          (dataObj.knowledge_query as
            | { messages?: Array<{ content?: string; type?: string }> }
            | undefined);
        const messages = routeObj?.messages ?? [];
        for (let i = messages.length - 1; i >= 0; i -= 1) {
          const msg = messages[i];
          if (msg?.type === "tool" || msg?.type === "system") continue;
          if (msg?.content) return msg.content;
        }
      }
      return null;
    }

    if (obj.type === "interrupt") {
      if (typeof obj.message === "string") return obj.message;
      if (typeof obj.data === "string") return obj.data;
    }

    const extractInterrupt = () => {
      const interrupts = obj.__interrupt__;
      if (!Array.isArray(interrupts) || interrupts.length === 0) return null;
      const last = interrupts[interrupts.length - 1];
      if (typeof last === "string") {
        const match = last.match(
          /Interrupt\\(value='([\\s\\S]*?)', id='.*?'\\)/,
        );
        if (match?.[1]) {
          return match[1].replace(/\\\\n/g, "\n");
        }
        return last.replace(/\\\\n/g, "\n");
      }
      if (typeof last === "object" && last !== null) {
        const value = (last as { value?: string }).value;
        if (value) {
          return value.replace(/\\\\n/g, "\n");
        }
      }
      return null;
    };

    const extractFromRoute = (routeKey: string) => {
      const routeObj = obj[routeKey] as
        | { messages?: Array<{ content?: string; type?: string }> }
        | undefined;
      const messages = routeObj?.messages ?? [];
      for (let i = messages.length - 1; i >= 0; i -= 1) {
        const msg = messages[i];
        if (msg?.type === "tool") continue;
        if (msg?.content) return msg.content;
      }
      return null;
    };

    const routed =
      extractFromRoute("knowledge_query") ??
      extractFromRoute("project_info_query");
    if (routed) return routed;

    const interrupt = extractInterrupt();
    if (interrupt) return interrupt;

    return null;
  };

  const streamSseResponse = async (
    response: Response,
    onContent: (content: string) => void,
  ) => {
    if (!response.ok || !response.body) {
      throw new Error(`AI 请求失败 (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.replace(/^data:\s*/, "");
          if (data === "[DONE]") {
            setIsThinking(false);
            return;
          }
          try {
            const payload = JSON.parse(data) as unknown;
            const content = extractContent(payload);
            if (content && content.length >= lastContentRef.current.length) {
              lastContentRef.current = content;
              onContent(content);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    }
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
      const response = await resumeAgentStream({
        message,
        approved,
        thread_id: threadIdRef.current,
      });
      await streamSseResponse(response, (content) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, content } : msg,
          ),
        );
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      logSilentError("AI 服务连接失败", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
    } finally {
      setIsThinking(false);
    }
  };

  const refreshCoreGraph = async (projectId: string) => {
    if (!token) return;
    const [coreGraph, costCurve, headcountCurve] = await Promise.all([
      getProjectCoreGraph(projectId, token),
      getProjectCostCurve(projectId, token),
      getProjectHeadcountCurve(projectId, token),
    ]);
    setCoreGraph(projectId, coreGraph);
    queryClient.setQueryData(
      ["funding-materials", "cost-curve", projectId],
      costCurve,
    );
    queryClient.setQueryData(
      ["funding-materials", "headcount-curve", projectId],
      headcountCurve,
    );
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

    if (!AI_SSE_URL) {
      logSilentError("未配置 AI SSE 地址");
      setIsThinking(false);
      return;
    }

    // 生成或复用 thread_id
    if (!threadIdRef.current) {
      threadIdRef.current = `thread-${createMessageId()}`;
      threadIdByProjectRef.current[activeProjectKey] = threadIdRef.current;
    }

    // 取消上一次请求
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
    const response = await fetch(AI_SSE_URL, {
      method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: messageText,
          thread_id: threadIdRef.current,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`AI 请求失败 (${response.status})`);
      }

      await streamSseResponse(response, (content) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, content } : msg,
          ),
        );
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      logSilentError("AI 服务连接失败", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
    } finally {
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
        logSilentError(
          `语音识别失败：${statusCode || response.status.toString()}`,
        );
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
        mimeType === ""
          ? new MediaRecorder(stream)
          : new MediaRecorder(stream, { mimeType });
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
      handleSendMessage();
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
