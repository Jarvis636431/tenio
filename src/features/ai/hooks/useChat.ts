import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  projectQueryKeys,
  useProject,
  getProjectCoreGraph,
  getProjectCostCurve,
  getProjectHeadcountCurve,
} from "@/features/project";
import { chatWithAgentStream, resumeAgentStream, extractChatMessageContent } from "@/features/ai";
import { useQueryClient } from "@tanstack/react-query";
import { useVoice } from "./useVoice";
import { createMessageId } from "@/lib/utils";
import { logSilentError } from "@/lib/log";

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

type ChatPanelOptions = {
  projectId?: string;
};

/**
 * 协调 AI 面板的聊天状态、SSE 流和语音输入。
 * 为每个项目维护独立的消息线程，支持中断恢复流程。
 *
 * @param options - 配置选项
 * @param options.projectId - 可选的项目 ID 覆盖（默认为路由参数或当前项目）
 * @returns Chat 组件所需的聊天状态和动作
 */
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

  /**
   * 刷新项目在 React Query 缓存中的核心图和曲线数据。
   * 当 AI 发送 shouldRefetch 事件时调用。
   *
   * @param projectId - 要刷新数据的项目 ID
   */
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

  /**
   * 使用用户的批准或拒绝恢复被中断的 AI 代理流程。
   * 创建新的 AI 消息占位符并流式返回响应。
   *
   * @param message - 用户对中断提示的回复
   * @param approved - 用户是否批准了提议的操作
   */
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
            logSilentError("[AI]", "AI 服务连接失败", error);
            setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
            setIsThinking(false);
          },
        },
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      logSilentError("[AI]", "AI 服务连接失败", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
      setIsThinking(false);
    }
  };

  /**
   * 通过 SSE 流向 AI 代理发送消息。
   * 创建用户和 AI 消息占位符，流式返回响应，并处理错误。
   * 当 AI 发送 shouldRefetch 事件时自动刷新项目数据。
   *
   * @param messageText - 要发送给 AI 的文本内容
   */
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
            logSilentError("[AI]", "AI 服务连接失败", error);
            setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
            setIsThinking(false);
          },
        },
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      logSilentError("[AI]", "AI 服务连接失败", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
      setIsThinking(false);
    }
  };

  /**
   * 去除首尾空白，通过 sendMessage 发送消息，并清空输入框。
   * 由 ChatInput 组件在提交时调用。
   */
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
