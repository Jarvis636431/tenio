import { create } from "zustand";

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export interface AgentTicketInfo {
  agentTicket: string;
  expiresAt: string;
  refreshAt: string;
  projectId: string;
}

interface ProjectChatState {
  messages: ChatMessage[];
  sessionId: string | null;
  agentBaseUrl: string | null;
  agentTicket: string | null;
  agentTicketExpiresAt: string | null;
  agentTicketRefreshAt: string | null;
  agentTicketProjectId: string | null;
  inputMessage: string;
  isThinking: boolean;
}

const createDefaultProjectState = (): ProjectChatState => ({
  messages: [],
  sessionId: null,
  agentBaseUrl: null,
  agentTicket: null,
  agentTicketExpiresAt: null,
  agentTicketRefreshAt: null,
  agentTicketProjectId: null,
  inputMessage: "",
  isThinking: false,
});

interface ChatState {
  /** 以 projectKey 为 key 聚合所有 per-project 状态 */
  projects: Record<string, ProjectChatState>;
  activeProjectKey: string;

  // Actions
  setActiveProjectKey: (key: string) => void;
  getMessages: (projectKey: string) => ChatMessage[];
  setMessages: (projectKey: string, messages: ChatMessage[]) => void;
  addMessage: (projectKey: string, message: ChatMessage) => void;
  updateLastAIMessage: (projectKey: string, content: string) => void;
  removeLastAIMessage: (projectKey: string) => void;
  setThreadId: (projectKey: string, threadId: string | null) => void;
  getThreadId: (projectKey: string) => string | null;
  setAgentBaseUrl: (projectKey: string, agentBaseUrl: string | null) => void;
  getAgentBaseUrl: (projectKey: string) => string | null;
  setAgentTicket: (
    projectKey: string,
    agentTicket: string | null,
    metadata?: Omit<AgentTicketInfo, "agentTicket">,
  ) => void;
  getAgentTicket: (projectKey: string) => string | null;
  getAgentTicketInfo: (projectKey: string) => AgentTicketInfo | null;
  getInputMessage: (projectKey: string) => string;
  setInputMessage: (projectKey: string, text: string) => void;
  getIsThinking: (projectKey: string) => boolean;
  setIsThinking: (projectKey: string, thinking: boolean) => void;
  resetProjectChat: (projectKey: string, welcomeMessage: ChatMessage) => void;
}

/** 返回将变更合并到单个 project 条目后的 partial state */
function updateProject(
  state: ChatState,
  projectKey: string,
  partial: Partial<ProjectChatState>,
): Pick<ChatState, "projects"> {
  return {
    projects: {
      ...state.projects,
      [projectKey]: {
        ...(state.projects[projectKey] ?? createDefaultProjectState()),
        ...partial,
      },
    },
  };
}

export const useChatStore = create<ChatState>()((set, get) => ({
  projects: {},
  activeProjectKey: "__default__",

  setActiveProjectKey: (key) => set({ activeProjectKey: key }),

  getMessages: (projectKey) => {
    return get().projects[projectKey]?.messages ?? [];
  },

  setMessages: (projectKey, messages) =>
    set((state) => updateProject(state, projectKey, { messages })),

  addMessage: (projectKey, message) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectKey]: {
          ...(state.projects[projectKey] ?? createDefaultProjectState()),
          messages: [...(state.projects[projectKey]?.messages ?? []), message],
        },
      },
    })),

  updateLastAIMessage: (projectKey, content) =>
    set((state) => {
      const project = state.projects[projectKey];
      if (!project || project.messages.length === 0) return state;

      const lastAIMessageIndex = [...project.messages]
        .reverse()
        .findIndex((m) => m.sender === "ai");
      if (lastAIMessageIndex === -1) return state;

      const actualIndex = project.messages.length - 1 - lastAIMessageIndex;
      const updatedMessages = [...project.messages];
      updatedMessages[actualIndex] = { ...updatedMessages[actualIndex], content };

      return updateProject(state, projectKey, { messages: updatedMessages });
    }),

  removeLastAIMessage: (projectKey) =>
    set((state) => {
      const project = state.projects[projectKey];
      if (!project || project.messages.length === 0) return state;

      const lastAIMessageIndex = [...project.messages]
        .reverse()
        .findIndex((m) => m.sender === "ai");
      if (lastAIMessageIndex === -1) return state;

      const actualIndex = project.messages.length - 1 - lastAIMessageIndex;
      const updatedMessages = project.messages.filter((_, i) => i !== actualIndex);

      return updateProject(state, projectKey, { messages: updatedMessages });
    }),

  setThreadId: (projectKey, threadId) =>
    set((state) => updateProject(state, projectKey, { sessionId: threadId })),

  getThreadId: (projectKey) => {
    return get().projects[projectKey]?.sessionId ?? null;
  },

  setAgentBaseUrl: (projectKey, agentBaseUrl) =>
    set((state) => updateProject(state, projectKey, { agentBaseUrl })),

  getAgentBaseUrl: (projectKey) => {
    return get().projects[projectKey]?.agentBaseUrl ?? null;
  },

  setAgentTicket: (projectKey, agentTicket, metadata) =>
    set((state) =>
      updateProject(state, projectKey, {
        agentTicket,
        agentTicketExpiresAt: agentTicket ? (metadata?.expiresAt ?? null) : null,
        agentTicketRefreshAt: agentTicket ? (metadata?.refreshAt ?? null) : null,
        agentTicketProjectId: agentTicket ? (metadata?.projectId ?? null) : null,
      }),
    ),

  getAgentTicket: (projectKey) => {
    return get().projects[projectKey]?.agentTicket ?? null;
  },

  getAgentTicketInfo: (projectKey) => {
    const project = get().projects[projectKey];
    if (
      !project?.agentTicket ||
      !project.agentTicketExpiresAt ||
      !project.agentTicketRefreshAt ||
      !project.agentTicketProjectId
    ) {
      return null;
    }
    return {
      agentTicket: project.agentTicket,
      expiresAt: project.agentTicketExpiresAt,
      refreshAt: project.agentTicketRefreshAt,
      projectId: project.agentTicketProjectId,
    };
  },

  getInputMessage: (projectKey) => {
    return get().projects[projectKey]?.inputMessage ?? "";
  },

  setInputMessage: (projectKey, text) =>
    set((state) => updateProject(state, projectKey, { inputMessage: text })),

  getIsThinking: (projectKey) => {
    return get().projects[projectKey]?.isThinking ?? false;
  },

  setIsThinking: (projectKey, thinking) =>
    set((state) => updateProject(state, projectKey, { isThinking: thinking })),

  resetProjectChat: (projectKey, welcomeMessage) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectKey]: { ...createDefaultProjectState(), messages: [{ ...welcomeMessage }] },
      },
    })),
}));
