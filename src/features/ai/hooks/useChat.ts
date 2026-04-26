import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { projectQueryKeys, useProject } from "@/features/project";
import { chatWithAgentStream, resumeAgentStream, extractChatMessageContent } from "@/features/ai";
import { useQueryClient } from "@tanstack/react-query";
import { useVoice } from "./useVoice";
import { createMessageId } from "@/lib/utils";
import { logSilentError } from "@/lib/log";
import { useChatStore, type ChatMessage } from "@/stores/chatStore";

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
  const abortRef = useRef<AbortController | null>(null);
  const lastContentRef = useRef<string>("");

  const defaultWelcomeMessage = useMemo<ChatMessage>(
    () => ({
      id: createMessageId(),
      content: "您好！我是 AI 助手，您可以输入施工相关问题或调整指令。",
      sender: "ai",
      timestamp: new Date(),
    }),
    [],
  );

  const activeProjectKey = useMemo(
    () => options.projectId || routeProjectId || currentProject?.id || "__default__",
    [options.projectId, routeProjectId, currentProject?.id],
  );

  // Store 状态和 actions
  const messages = useChatStore((state) => state.getMessages(activeProjectKey));
  const inputMessage = useChatStore((state) => state.inputMessage);
  const isThinking = useChatStore((state) => state.isThinking);
  const setActiveProjectKey = useChatStore((state) => state.setActiveProjectKey);
  const setInputMessage = useChatStore((state) => state.setInputMessage);
  const setIsThinking = useChatStore((state) => state.setIsThinking);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateLastAIMessage = useChatStore((state) => state.updateLastAIMessage);
  const removeLastAIMessage = useChatStore((state) => state.removeLastAIMessage);
  const setThreadId = useChatStore((state) => state.setThreadId);
  const getThreadId = useChatStore((state) => state.getThreadId);
  const {
    state: { isRecording, isRecognizing },
    actions: { toggleRecording },
    recognizedText,
    clearRecognizedText,
  } = useVoice();

  const resolveProjectId = (projectRef: string) => {
    if (!projectRef) return "";
    const directMatch = projects.find((project) => project.id === projectRef);
    if (directMatch) return directMatch.id;
    return projectRef;
  };

  // 切换项目时重置聊天状态
  useEffect(() => {
    setActiveProjectKey(activeProjectKey);
  }, [activeProjectKey, setActiveProjectKey]);

  useEffect(() => {
    const currentMessages = useChatStore.getState().getMessages(activeProjectKey);
    if (currentMessages.length === 0) {
      setMessages(activeProjectKey, [{ ...defaultWelcomeMessage }]);
    }
  }, [activeProjectKey, defaultWelcomeMessage, setMessages]);

  // 同步语音识别结果到输入框
  useEffect(() => {
    if (recognizedText) {
      setInputMessage(recognizedText);
      clearRecognizedText();
    }
  }, [recognizedText, clearRecognizedText, setInputMessage]);

  // 清理 AbortController
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  /**
   * 刷新项目在 React Query 缓存中的工作台产物数据。
   * 当 AI 发送 shouldRefetch 事件时调用。
   *
   * @param projectId - 要刷新数据的项目 ID
   */
  const refreshOverviewArtifacts = async (projectId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.scheduleArtifact(projectId),
      }),
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.timeCostArtifact(projectId),
      }),
    ]);
  };

  /**
   * 使用用户的批准或拒绝恢复被中断的 AI 代理流程。
   * 创建新的 AI 消息占位符并流式返回响应。
   *
   * @param message - 用户对中断提示的回复
   * @param approved - 用户是否批准了提议的操作
   */
  const resumeInterrupt = async (message: string, approved: boolean) => {
    const threadId = getThreadId(activeProjectKey);
    if (!threadId) {
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    const aiMessageId = createMessageId();
    lastContentRef.current = "";

    addMessage(activeProjectKey, {
      id: aiMessageId,
      content: "",
      sender: "ai",
      timestamp: new Date(),
    });
    setIsThinking(true);

    try {
      await resumeAgentStream(
        {
          message,
          approved,
          thread_id: threadId,
        },
        {
          signal: abortRef.current.signal,
          onMessage: (payload) => {
            const { content } = extractChatMessageContent(payload);
            if (content && content.length >= lastContentRef.current.length) {
              lastContentRef.current = content;
              updateLastAIMessage(activeProjectKey, content);
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
            removeLastAIMessage(activeProjectKey);
            setIsThinking(false);
          },
        },
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      logSilentError("[AI]", "AI 服务连接失败", error);
      removeLastAIMessage(activeProjectKey);
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

    addMessage(activeProjectKey, userMessage);
    setIsThinking(true);

    let threadId = getThreadId(activeProjectKey);
    if (!threadId) {
      threadId = `thread-${createMessageId()}`;
      setThreadId(activeProjectKey, threadId);
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    const aiMessageId = createMessageId();
    lastContentRef.current = "";

    addMessage(activeProjectKey, {
      id: aiMessageId,
      content: "",
      sender: "ai",
      timestamp: new Date(),
    });

    try {
      await chatWithAgentStream(
        {
          message: messageText,
          thread_id: threadId,
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
                  const projectId = resolveProjectId(projectRef);
                  if (projectId) {
                    await refreshOverviewArtifacts(projectId);
                  }
                })();
              }
              return;
            }

            // 更新消息内容
            if (content && content.length >= lastContentRef.current.length) {
              lastContentRef.current = content;
              updateLastAIMessage(activeProjectKey, content);
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
            removeLastAIMessage(activeProjectKey);
            setIsThinking(false);
          },
        },
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      logSilentError("[AI]", "AI 服务连接失败", error);
      removeLastAIMessage(activeProjectKey);
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
    scrollAreaRef: useRef<HTMLDivElement | null>(null),
  };
}

export type ChatState = ReturnType<typeof useChat>;
