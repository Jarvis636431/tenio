import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  projectQueryKeys,
  useProject,
  getProjectCoreGraph,
  getProjectCostCurve,
  getProjectHeadcountCurve,
} from "@/features/project";
import {
  chatWithAgentStream,
  resumeAgentStream,
  extractChatMessageContent,
} from "../services/ai-service";
import { useQueryClient } from "@tanstack/react-query";
import { useVoice } from "./useVoice";

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

export function useChat(options: ChatPanelOptions = {}) {
  const { id: routeProjectId } = useParams();
  const { currentProject, projects } = useProject();
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
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const threadIdRef = useRef<string | null>(null);
  const threadIdByProjectRef = useRef<Record<string, string | null>>({});
  const messagesByProjectRef = useRef<Record<string, ChatMessage[]>>({});
  const latestMessagesRef = useRef<ChatMessage[]>(messages);
  const lastProjectKeyRef = useRef<string>("");
  const lastContentRef = useRef<string>("");

  const {
    state: { isRecording, isRecognizing },
    actions: { toggleRecording },
    recognizedText,
    clearRecognizedText,
  } = useVoice();

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
    };
  }, []);

  // 同步语音识别结果到输入框
  useEffect(() => {
    if (recognizedText) {
      setInputMessage(recognizedText);
      clearRecognizedText();
    }
  }, [recognizedText, clearRecognizedText]);

  const refreshCoreGraph = async (projectId: string) => {
    const [coreGraph, costCurve, headcountCurve] = await Promise.all([
      getProjectCoreGraph(projectId),
      getProjectCostCurve(projectId),
      getProjectHeadcountCurve(projectId),
    ]);
    queryClient.setQueryData(projectQueryKeys.coreGraph(projectId), coreGraph);
    queryClient.setQueryData(projectQueryKeys.costCurve(projectId), costCurve);
    queryClient.setQueryData(projectQueryKeys.headcountCurve(projectId), headcountCurve);
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
    handleInputEnter: (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        void handleSendMessage();
      }
    },
    toggleRecording,
    scrollAreaRef,
  };
}

export type ChatState = ReturnType<typeof useChat>;
