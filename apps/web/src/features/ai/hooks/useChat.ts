import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getProjectOperationStatus, projectQueryKeys, useProject } from "@/features/project";
import {
  createAgentSession,
  sendAgentSessionMessage,
  subscribeAgentStreamSse,
} from "../services/ai-api";
import { extractChatMessageContent } from "../services/ai-service";
import { createMessageId } from "@/lib/utils";
import { logSilentError } from "@/lib/log";
import { useChatStore, type ChatMessage } from "@/stores/chatStore";

type ChatPanelOptions = {
  projectId?: string;
};

const EMPTY_CHAT_MESSAGES: ChatMessage[] = [];

/**
 * 协调 AI 面板的聊天状态和 SSE 流。
 * 为每个项目维护独立会话，并通过 JWT 直接访问后端 agent 模块。
 */
export function useChat(options: ChatPanelOptions = {}) {
  const { id: routeProjectId } = useParams();
  const { currentProject, projects } = useProject();
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const lastContentRef = useRef<string>("");
  const pollingOperationIdsRef = useRef<Set<string>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

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

  const messages = useChatStore(
    (state) => state.projects[activeProjectKey]?.messages ?? EMPTY_CHAT_MESSAGES,
  );
  const inputMessage = useChatStore(
    (state) => state.projects[activeProjectKey]?.inputMessage ?? "",
  );
  const isThinking = useChatStore((state) => state.projects[activeProjectKey]?.isThinking ?? false);

  const setActiveProjectKey = useChatStore((state) => state.setActiveProjectKey);
  const setInputMessage = useChatStore((state) => state.setInputMessage);
  const setIsThinking = useChatStore((state) => state.setIsThinking);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateLastAIMessage = useChatStore((state) => state.updateLastAIMessage);
  const removeLastAIMessage = useChatStore((state) => state.removeLastAIMessage);
  const setThreadId = useChatStore((state) => state.setThreadId);
  const getThreadId = useChatStore((state) => state.getThreadId);

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
    const directMatch = projects.find((project) => project.id === projectRef);
    if (directMatch) return directMatch.id;
    return projectRef;
  };

  useEffect(() => {
    setActiveProjectKey(activeProjectKey);
  }, [activeProjectKey, setActiveProjectKey]);

  useEffect(() => {
    const currentMessages = useChatStore.getState().getMessages(activeProjectKey);
    if (currentMessages.length === 0) {
      setMessages(activeProjectKey, [{ ...defaultWelcomeMessage }]);
    }
  }, [activeProjectKey, defaultWelcomeMessage, setMessages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.uploadSummary(projectId),
      }),
    ]);
  };

  const resolveActiveProjectId = () => {
    const projectRef = options.projectId || routeProjectId || currentProject?.id || "";
    return resolveProjectId(projectRef);
  };

  const pollOperationStatus = async (projectId: string, operationId: string) => {
    if (pollingOperationIdsRef.current.has(operationId)) {
      return;
    }
    pollingOperationIdsRef.current.add(operationId);

    try {
      const maxAttempts = 60;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const operation = await getProjectOperationStatus(projectId, operationId);
        const normalizedStatus = operation.status?.toLowerCase() ?? "";

        if (normalizedStatus === "completed") {
          await refreshOverviewArtifacts(projectId);
          return;
        }

        if (normalizedStatus === "failed" || normalizedStatus === "canceled") {
          throw new Error(operation.error_message ?? "AI 操作执行失败");
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1500));
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

  const ensureAgentSession = async (projectId: string) => {
    const existingSessionId = getThreadId(activeProjectKey);
    if (existingSessionId) {
      return existingSessionId;
    }

    const session = await createAgentSession(projectId);
    const chatSessionId = session.current_session.id;
    setThreadId(activeProjectKey, chatSessionId);
    return chatSessionId;
  };

  const streamAgentReply = async (
    projectId: string,
    chatSessionId: string,
    messageText: string,
    signal: AbortSignal,
  ) => {
    const message = await sendAgentSessionMessage(projectId, chatSessionId, {
      content: messageText,
    });

    if (!message.stream_id) {
      throw new Error("发送 AI 消息失败：缺少 stream_id");
    }

    await subscribeAgentStreamSse(projectId, message.stream_id, {
      signal,
      onMessage: (payload) => {
        const { content, shouldPollOperation, shouldRefetch, operationId } =
          extractChatMessageContent(payload);
        const activeProjectId = resolveActiveProjectId();

        if (shouldPollOperation && operationId && activeProjectId) {
          void pollOperationStatus(activeProjectId, operationId);
        }

        if (shouldRefetch && activeProjectId) {
          void refreshOverviewArtifacts(activeProjectId);
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
    });
  };

  const resumeInterrupt = async (message: string, approved: boolean) => {
    abortRef.current?.abort();
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
      const sessionId = await ensureAgentSession(projectId);
      await streamAgentReply(
        projectId,
        sessionId,
        `${approved ? "同意" : "拒绝"}：${message}`,
        abortRef.current.signal,
      );
    } catch (error) {
      handleStreamError(error as Error);
    }
  };

  const sendMessage = async (messageText: string) => {
    addMessage(activeProjectKey, {
      id: createMessageId(),
      content: messageText,
      sender: "user",
      timestamp: new Date(),
    });
    setIsThinking(activeProjectKey, true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    lastContentRef.current = "";
    addMessage(activeProjectKey, {
      id: createMessageId(),
      content: "",
      sender: "ai",
      timestamp: new Date(),
    });

    try {
      const projectId = resolveActiveProjectId();
      if (!projectId) {
        throw new Error("缺少项目 ID");
      }
      const sessionId = await ensureAgentSession(projectId);
      await streamAgentReply(projectId, sessionId, messageText, abortRef.current.signal);
    } catch (error) {
      handleStreamError(error as Error);
    }
  };

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
    scrollAreaRef,
  };
}

export type ChatState = ReturnType<typeof useChat>;
