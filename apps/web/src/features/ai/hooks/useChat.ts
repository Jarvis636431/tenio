import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getProjectOperationStatus, projectQueryKeys, useProject } from "@/features/project";
import {
  initAgentSession,
  issueAgentTicket,
  sendAgentSessionMessage,
  subscribeAgentStreamSse,
} from "../services/ai-api";
import { extractChatMessageContent } from "../services/ai-service";
import { createMessageId } from "@/lib/utils";
import { logSilentError } from "@/lib/log";
import { ApiRequestError } from "@/services/http";
import { useChatStore, type AgentTicketInfo, type ChatMessage } from "@/stores/chatStore";

type ChatPanelOptions = {
  projectId?: string;
};

const EMPTY_CHAT_MESSAGES: ChatMessage[] = [];

/**
 * 协调 AI 面板的聊天状态和 SSE 流。
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
  const pollingOperationIdsRef = useRef<Set<string>>(new Set());
  const agentTicketRefreshPromiseRef = useRef<Promise<AgentTicketInfo> | null>(null);

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

  // Store 状态（读取值，会触发重渲染）
  const messages = useChatStore(
    (state) => state.projects[activeProjectKey]?.messages ?? EMPTY_CHAT_MESSAGES,
  );
  const inputMessage = useChatStore(
    (state) => state.projects[activeProjectKey]?.inputMessage ?? "",
  );
  const isThinking = useChatStore((state) => state.projects[activeProjectKey]?.isThinking ?? false);

  // Store actions（引用稳定，单独选择器不会触发额外重渲染）
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
  const setAgentTicket = useChatStore((state) => state.setAgentTicket);
  const getAgentTicket = useChatStore((state) => state.getAgentTicket);
  const getAgentTicketInfo = useChatStore((state) => state.getAgentTicketInfo);

  /**
   * 统一处理 SSE 流或会话中的错误。
   * 忽略 AbortError，其余错误记录日志并清理最后一条 AI 消息。
   */
  const handleStreamError = useCallback(
    (error: Error) => {
      if (error.name === "AbortError") {
        return;
      }
      logSilentError("[AI]", "AI 服务连接失败", error);
      removeLastAIMessage(activeProjectKey);
      setIsThinking(activeProjectKey, false);
    },
    [activeProjectKey, removeLastAIMessage, setIsThinking],
  );

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
        queryKey: projectQueryKeys.graphArtifact(projectId),
      }),
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.timeCostArtifact(projectId),
      }),
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.documentArtifact(projectId),
      }),
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.crewPlanArtifact(projectId),
      }),
    ]);
  };

  const resolveActiveProjectId = () => {
    const projectRef = options.projectId || routeProjectId || currentProject?.project_id || "";
    return resolveProjectId(projectRef);
  };

  const isAgentTicketExpiredError = (error: unknown) => {
    if (!(error instanceof ApiRequestError)) {
      return false;
    }
    const data = error.data;
    if (!data || typeof data !== "object") {
      return false;
    }
    const code = (data as Record<string, unknown>).code;
    return error.status === 401 && code === "AGENT_TICKET_EXPIRED";
  };

  const pollOperationStatus = async (projectId: string, operationId: string) => {
    if (pollingOperationIdsRef.current.has(operationId)) {
      return;
    }
    pollingOperationIdsRef.current.add(operationId);

    try {
      const maxAttempts = 90;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const status = await getProjectOperationStatus(projectId, operationId);
        const normalizedStatus = status.operation_status?.toLowerCase() ?? "";

        if (normalizedStatus === "succeeded" || normalizedStatus === "completed") {
          await refreshOverviewArtifacts(projectId);
          return;
        }

        if (normalizedStatus === "failed" || normalizedStatus === "error") {
          throw new Error(status.error_message ?? "AI 操作执行失败");
        }

        await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }

      throw new Error("AI 操作执行超时，请稍后刷新查看结果");
    } catch (error) {
      addMessage(activeProjectKey, {
        id: createMessageId(),
        content: error instanceof Error ? error.message : "AI 操作状态查询失败",
        sender: "ai",
        timestamp: new Date(),
      });
      setIsThinking(activeProjectKey, false);
    } finally {
      pollingOperationIdsRef.current.delete(operationId);
    }
  };

  const issueProjectAgentTicket = async (projectId: string): Promise<AgentTicketInfo> => {
    const ticket = await issueAgentTicket({
      product_code: "apm",
      project_id: projectId,
      grant_type: "project_agent_access",
    });
    const refreshAt = new Date(
      Date.now() + Math.max(ticket.refresh_after_seconds, 0) * 1000,
    ).toISOString();
    const ticketInfo = {
      agentTicket: ticket.agent_ticket,
      expiresAt: ticket.expires_at,
      refreshAt,
      projectId,
    };
    setAgentBaseUrl(activeProjectKey, null);
    setAgentTicket(activeProjectKey, ticket.agent_ticket, ticketInfo);
    return ticketInfo;
  };

  const ensureFreshAgentTicket = async (projectId: string, forceRefresh = false) => {
    const existingTicket = getAgentTicketInfo(activeProjectKey);
    const refreshTime = existingTicket ? Date.parse(existingTicket.refreshAt) : Number.NaN;
    if (
      !forceRefresh &&
      existingTicket &&
      existingTicket.projectId === projectId &&
      Number.isFinite(refreshTime) &&
      refreshTime > Date.now()
    ) {
      return existingTicket;
    }

    if (!forceRefresh && agentTicketRefreshPromiseRef.current) {
      return agentTicketRefreshPromiseRef.current;
    }

    agentTicketRefreshPromiseRef.current = issueProjectAgentTicket(projectId).finally(() => {
      agentTicketRefreshPromiseRef.current = null;
    });
    return agentTicketRefreshPromiseRef.current;
  };

  const runWithAgentTicketRetry = async <T>(
    projectId: string,
    operation: (agentTicket: string) => Promise<T>,
  ) => {
    const ticket = await ensureFreshAgentTicket(projectId);
    try {
      return await operation(ticket.agentTicket);
    } catch (error) {
      if (!isAgentTicketExpiredError(error)) {
        throw error;
      }
      const refreshedTicket = await ensureFreshAgentTicket(projectId, true);
      return operation(refreshedTicket.agentTicket);
    }
  };

  const ensureAgentSession = async (projectId: string) => {
    const existingSessionId = getThreadId(activeProjectKey);
    if (existingSessionId) {
      const ticket = await ensureFreshAgentTicket(projectId);

      return {
        chatSessionId: existingSessionId,
        agentBaseUrl: undefined,
        agentTicket: ticket.agentTicket,
      };
    }

    const session = await runWithAgentTicketRetry(projectId, (agentTicket) =>
      initAgentSession(
        {
          product_code: "apm",
          project_id: projectId,
          agent_ticket: agentTicket,
        },
        { agentTicket },
      ),
    );

    setThreadId(activeProjectKey, session.chat_session_id);

    return {
      chatSessionId: session.chat_session_id,
      agentBaseUrl: undefined,
      agentTicket: getAgentTicket(activeProjectKey) ?? undefined,
    };
  };

  const streamAgentReply = async (
    projectId: string,
    chatSessionId: string,
    messageText: string,
    signal: AbortSignal,
    agentBaseUrl?: string,
  ) => {
    const message = await runWithAgentTicketRetry(projectId, (agentTicket) =>
      sendAgentSessionMessage(
        chatSessionId,
        { content_text: messageText },
        { agentBaseUrl, agentTicket },
      ),
    );

    if (!message.stream_id) {
      throw new Error("发送 AI 消息失败：缺少 stream_id");
    }

    await runWithAgentTicketRetry(projectId, (agentTicket) =>
      subscribeAgentStreamSse(message.stream_id, {
        agentBaseUrl,
        agentTicket,
        signal,
        onMessage: (payload) => {
          const { content, shouldRefetch, operationId } = extractChatMessageContent(payload);
          const activeProjectId = resolveActiveProjectId();

          if (operationId && activeProjectId) {
            void pollOperationStatus(activeProjectId, operationId);
          }

          if (shouldRefetch) {
            if (activeProjectId) {
              void refreshOverviewArtifacts(activeProjectId);
            }
            return;
          }

          if (content && content.length >= lastContentRef.current.length) {
            lastContentRef.current = content;
            updateLastAIMessage(activeProjectKey, content);
          }
        },
        onDone: () => {
          setIsThinking(activeProjectKey, false);
        },
        onError: handleStreamError,
      }),
    );
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
    setIsThinking(activeProjectKey, true);

    try {
      const projectId = resolveActiveProjectId();
      if (!projectId) {
        throw new Error("缺少项目 ID");
      }
      const session = await ensureAgentSession(projectId);
      await streamAgentReply(
        projectId,
        session.chatSessionId,
        `${approved ? "同意" : "拒绝"}：${message}`,
        abortRef.current.signal,
        session.agentBaseUrl,
      );
    } catch (error) {
      handleStreamError(error as Error);
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
    setIsThinking(activeProjectKey, true);

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
        projectId,
        session.chatSessionId,
        messageText,
        abortRef.current.signal,
        session.agentBaseUrl,
      );
    } catch (error) {
      handleStreamError(error as Error);
    }
  };

  /**
   * 去除首尾空白，通过 sendMessage 发送消息，并清空输入框。
   * 由 ChatInput 组件在提交时调用。
   */
  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;
    setInputMessage(activeProjectKey, "");
    await sendMessage(trimmed);
  };

  return {
    messages,
    inputMessage,
    setInputMessage: (value: string) => setInputMessage(activeProjectKey, value),
    isThinking,
    handleSendMessage,
    sendQuickMessage: sendMessage,
    resumeInterrupt,
    handleInputEnter: (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        void handleSendMessage();
      }
    },
    scrollAreaRef: useRef<HTMLDivElement | null>(null),
  };
}

export type ChatState = ReturnType<typeof useChat>;
