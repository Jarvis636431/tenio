import { beforeEach, describe, expect, it } from "vitest";
import { useChatStore, type ChatMessage } from "@/stores/chatStore";

const welcomeMessage: ChatMessage = {
  id: "welcome",
  content: "欢迎",
  sender: "ai",
  timestamp: new Date("2026-01-01T00:00:00.000Z"),
};

describe("chatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      projects: {},
      activeProjectKey: "__default__",
    });
  });

  it("keeps input messages isolated by project", () => {
    const store = useChatStore.getState();

    store.setInputMessage("project-a", "项目 A 输入");
    store.setInputMessage("project-b", "项目 B 输入");

    expect(useChatStore.getState().getInputMessage("project-a")).toBe("项目 A 输入");
    expect(useChatStore.getState().getInputMessage("project-b")).toBe("项目 B 输入");
    expect(useChatStore.getState().getInputMessage("project-c")).toBe("");
  });

  it("keeps thinking state isolated by project", () => {
    const store = useChatStore.getState();

    store.setIsThinking("project-a", true);

    expect(useChatStore.getState().getIsThinking("project-a")).toBe(true);
    expect(useChatStore.getState().getIsThinking("project-b")).toBe(false);
  });

  it("keeps session ids isolated by project", () => {
    const store = useChatStore.getState();

    store.setThreadId("project-a", "session-a");
    store.setThreadId("project-b", "session-b");

    expect(useChatStore.getState().getThreadId("project-a")).toBe("session-a");
    expect(useChatStore.getState().getThreadId("project-b")).toBe("session-b");
    expect(useChatStore.getState().getThreadId("project-c")).toBeNull();
  });

  it("resetProjectChat clears only the selected project's input, thinking state and session", () => {
    const store = useChatStore.getState();

    store.setInputMessage("project-a", "待清空");
    store.setInputMessage("project-b", "保留");
    store.setIsThinking("project-a", true);
    store.setIsThinking("project-b", true);
    store.setThreadId("project-a", "session-a");
    store.setThreadId("project-b", "session-b");

    store.resetProjectChat("project-a", welcomeMessage);

    const state = useChatStore.getState();
    expect(state.getInputMessage("project-a")).toBe("");
    expect(state.getInputMessage("project-b")).toBe("保留");
    expect(state.getIsThinking("project-a")).toBe(false);
    expect(state.getIsThinking("project-b")).toBe(true);
    expect(state.getThreadId("project-a")).toBeNull();
    expect(state.getThreadId("project-b")).toBe("session-b");
    expect(state.getMessages("project-a")).toEqual([welcomeMessage]);
  });
});
