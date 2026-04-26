import { create } from "zustand";

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatState {
  /** 按项目隔离的消息列表 */
  messagesByProject: Record<string, ChatMessage[]>;
  /** 按项目的 agent 会话 ID */
  sessionIdByProject: Record<string, string | null>;
  /** 按项目的 agent 服务地址 */
  agentBaseUrlByProject: Record<string, string | null>;
  /** 当前活跃的项目 key */
  activeProjectKey: string;
  /** 输入框文本 */
  inputMessage: string;
  /** AI 是否正在思考 */
  isThinking: boolean;

  // Actions
  /** 设置当前活跃项目 */
  setActiveProjectKey: (key: string) => void;
  /** 获取当前项目消息 */
  getMessages: (projectKey: string) => ChatMessage[];
  /** 设置项目消息 */
  setMessages: (projectKey: string, messages: ChatMessage[]) => void;
  /** 添加消息到指定项目 */
  addMessage: (projectKey: string, message: ChatMessage) => void;
  /** 更新指定项目的最后一条 AI 消息内容 */
  updateLastAIMessage: (projectKey: string, content: string) => void;
  /** 移除指定项目的最后一条消息 */
  removeLastAIMessage: (projectKey: string) => void;
  /** 设置指定项目的会话 ID */
  setThreadId: (projectKey: string, threadId: string | null) => void;
  /** 获取指定项目的会话 ID */
  getThreadId: (projectKey: string) => string | null;
  /** 设置指定项目的 agent 服务地址 */
  setAgentBaseUrl: (projectKey: string, agentBaseUrl: string | null) => void;
  /** 获取指定项目的 agent 服务地址 */
  getAgentBaseUrl: (projectKey: string) => string | null;
  /** 设置输入框文本 */
  setInputMessage: (text: string) => void;
  /** 设置思考状态 */
  setIsThinking: (thinking: boolean) => void;
  /** 重置指定项目的聊天状态 */
  resetProjectChat: (projectKey: string, welcomeMessage: ChatMessage) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messagesByProject: {},
  sessionIdByProject: {},
  agentBaseUrlByProject: {},
  activeProjectKey: "__default__",
  inputMessage: "",
  isThinking: false,

  setActiveProjectKey: (key) => set({ activeProjectKey: key }),

  getMessages: (projectKey) => {
    return get().messagesByProject[projectKey] || [];
  },

  setMessages: (projectKey, messages) =>
    set((state) => ({
      messagesByProject: {
        ...state.messagesByProject,
        [projectKey]: messages,
      },
    })),

  addMessage: (projectKey, message) =>
    set((state) => ({
      messagesByProject: {
        ...state.messagesByProject,
        [projectKey]: [...(state.messagesByProject[projectKey] || []), message],
      },
    })),

  updateLastAIMessage: (projectKey, content) =>
    set((state) => {
      const messages = state.messagesByProject[projectKey];
      if (!messages || messages.length === 0) return state;

      // 找到最后一条 AI 消息并更新
      const lastAIMessageIndex = [...messages].reverse().findIndex((m) => m.sender === "ai");
      if (lastAIMessageIndex === -1) return state;

      const actualIndex = messages.length - 1 - lastAIMessageIndex;
      const updatedMessages = [...messages];
      updatedMessages[actualIndex] = { ...updatedMessages[actualIndex], content };

      return {
        messagesByProject: {
          ...state.messagesByProject,
          [projectKey]: updatedMessages,
        },
      };
    }),

  removeLastAIMessage: (projectKey) =>
    set((state) => {
      const messages = state.messagesByProject[projectKey];
      if (!messages || messages.length === 0) return state;

      // 移除最后一条 AI 消息
      const lastAIMessageIndex = [...messages].reverse().findIndex((m) => m.sender === "ai");
      if (lastAIMessageIndex === -1) return state;

      const actualIndex = messages.length - 1 - lastAIMessageIndex;
      const updatedMessages = messages.filter((_, i) => i !== actualIndex);

      return {
        messagesByProject: {
          ...state.messagesByProject,
          [projectKey]: updatedMessages,
        },
      };
    }),

  setThreadId: (projectKey, threadId) =>
    set((state) => ({
      sessionIdByProject: {
        ...state.sessionIdByProject,
        [projectKey]: threadId,
      },
    })),

  getThreadId: (projectKey) => {
    return get().sessionIdByProject[projectKey] ?? null;
  },

  setAgentBaseUrl: (projectKey, agentBaseUrl) =>
    set((state) => ({
      agentBaseUrlByProject: {
        ...state.agentBaseUrlByProject,
        [projectKey]: agentBaseUrl,
      },
    })),

  getAgentBaseUrl: (projectKey) => {
    return get().agentBaseUrlByProject[projectKey] ?? null;
  },

  setInputMessage: (text) => set({ inputMessage: text }),

  setIsThinking: (thinking) => set({ isThinking: thinking }),

  resetProjectChat: (projectKey, welcomeMessage) =>
    set((state) => ({
      messagesByProject: {
        ...state.messagesByProject,
        [projectKey]: [{ ...welcomeMessage }],
      },
      sessionIdByProject: {
        ...state.sessionIdByProject,
        [projectKey]: null,
      },
      agentBaseUrlByProject: {
        ...state.agentBaseUrlByProject,
        [projectKey]: null,
      },
    })),
}));
