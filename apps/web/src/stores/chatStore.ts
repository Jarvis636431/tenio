import { create } from "zustand";

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ProjectChatState {
  messages: ChatMessage[];
  sessionId: string | null;
  inputMessage: string;
  isThinking: boolean;
}

const createDefaultProjectState = (): ProjectChatState => ({
  messages: [],
  sessionId: null,
  inputMessage: "",
  isThinking: false,
});

interface ChatState {
  /** 以 projectKey 为 key 聚合所有 per-project 状态 */
  projects: Record<string, ProjectChatState>;
  activeProjectKey: string;

  setActiveProjectKey: (key: string) => void;
  getMessages: (projectKey: string) => ChatMessage[];
  setMessages: (projectKey: string, messages: ChatMessage[]) => void;
  addMessage: (projectKey: string, message: ChatMessage) => void;
  updateLastAIMessage: (projectKey: string, content: string) => void;
  removeLastAIMessage: (projectKey: string) => void;
  setThreadId: (projectKey: string, threadId: string | null) => void;
  getThreadId: (projectKey: string) => string | null;
  getInputMessage: (projectKey: string) => string;
  setInputMessage: (projectKey: string, text: string) => void;
  getIsThinking: (projectKey: string) => boolean;
  setIsThinking: (projectKey: string, thinking: boolean) => void;
  resetProjectChat: (projectKey: string, welcomeMessage: ChatMessage) => void;
}

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

  getMessages: (projectKey) => get().projects[projectKey]?.messages ?? [],

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
        .findIndex((message) => message.sender === "ai");
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
        .findIndex((message) => message.sender === "ai");
      if (lastAIMessageIndex === -1) return state;

      const actualIndex = project.messages.length - 1 - lastAIMessageIndex;
      const updatedMessages = project.messages.filter((_, index) => index !== actualIndex);

      return updateProject(state, projectKey, { messages: updatedMessages });
    }),

  setThreadId: (projectKey, threadId) =>
    set((state) => updateProject(state, projectKey, { sessionId: threadId })),

  getThreadId: (projectKey) => get().projects[projectKey]?.sessionId ?? null,

  getInputMessage: (projectKey) => get().projects[projectKey]?.inputMessage ?? "",

  setInputMessage: (projectKey, text) =>
    set((state) => updateProject(state, projectKey, { inputMessage: text })),

  getIsThinking: (projectKey) => get().projects[projectKey]?.isThinking ?? false,

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
