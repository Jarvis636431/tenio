import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { projectQueryKeys, useProject } from "@/features/project";
import { extractChatMessageContent } from "@/features/ai";
import {
  initAgentSession,
  issueAgentTicket,
  sendAgentSessionMessage,
  subscribeAgentSessionSse,
} from "../services/ai-api";
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
 * 为每个项目维护独立的 agent 会话，支持中断确认消息续写。
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
    () => options.projectId || routeProjectId || currentProject?.project_id || "__default__",
    [options.projectId, routeProjectId, currentProject?.project_id],
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
  const setAgentBaseUrl = useChatStore((state) => state.setAgentBaseUrl);
  const getAgentBaseUrl = useChatStore((state) => state.getAgentBaseUrl);
  const {
    state: { isRecording, isRecognizing },
    actions: { toggleRecording },
    recognizedText,
    clearRecognizedText,
  } = useVoice();

  const resolveProjectId = (projectRef: string) => {
    if (!projectRef) return "";
    const directMatch = projects.find((project) => project.project_id === projectRef);
    if (directMatch) return directMatch.project_id;
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

  const resolveActiveProjectId = () => {
    const projectRef = options.projectId || routeProjectId || currentProject?.project_id || "";
    return resolveProjectId(projectRef);
  };

  const ensureAgentSession = async (projectId: string) => {
    const existingSessionId = getThreadId(activeProjectKey);
    const existingAgentBaseUrl = getAgentBaseUrl(activeProjectKey) ?? undefined;
    if (existingSessionId) {
      return {
        chatSessionId: existingSessionId,
        agentBaseUrl: existingAgentBaseUrl,
      };
    }

    const ticket = await issueAgentTicket({
      product_code: "apm",
      project_id: projectId,
      grant_type: "project_agent_access",
    });
    const session = await initAgentSession(
      {
        product_code: "apm",
        project_id: projectId,
        agent_ticket: ticket.agent_ticket,
      },
      { agentBaseUrl: ticket.agent_base_url },
    );

    setThreadId(activeProjectKey, session.chat_session_id);
    setAgentBaseUrl(activeProjectKey, ticket.agent_base_url);

    return {
      chatSessionId: session.chat_session_id,
      agentBaseUrl: ticket.agent_base_url,
    };
  };

  const streamAgentReply = async (
    chatSessionId: string,
    messageText: string,
    signal: AbortSignal,
    agentBaseUrl?: string,
  ) => {
    const streamPromise = subscribeAgentSessionSse(chatSessionId, {
      agentBaseUrl,
      signal,
      onMessage: (payload) => {
        const { content, shouldRefetch } = extractChatMessageContent(payload);

        if (shouldRefetch) {
          const projectId = resolveActiveProjectId();
          if (projectId) {
            void refreshOverviewArtifacts(projectId);
          }
          return;
        }

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
    });

    await sendAgentSessionMessage(chatSessionId, { content_text: messageText }, { agentBaseUrl });
    await streamPromise;
  };

  /**
   * 使用用户的批准或拒绝恢复被中断的 AI 代理流程。
   * 创建新的 AI 消息占位符并流式返回响应。
   *
   * @param message - 用户对中断提示的回复
   * @param approved - 用户是否批准了提议的操作
   */
  const resumeInterrupt = async (message: string, approved: boolean) => {
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
      const projectId = resolveActiveProjectId();
      if (!projectId) {
        throw new Error("缺少项目 ID");
      }
      const session = await ensureAgentSession(projectId);
      await streamAgentReply(
        session.chatSessionId,
        `${approved ? "同意" : "拒绝"}：${message}`,
        abortRef.current.signal,
        session.agentBaseUrl,
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
      const projectId = resolveActiveProjectId();
      if (!projectId) {
        throw new Error("缺少项目 ID");
      }
      const session = await ensureAgentSession(projectId);
      await streamAgentReply(
        session.chatSessionId,
        messageText,
        abortRef.current.signal,
        session.agentBaseUrl,
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
