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
      messagesByProject: {},
      sessionIdByProject: {},
      agentBaseUrlByProject: {},
      activeProjectKey: "__default__",
      inputMessageByProject: {},
      thinkingByProject: {},
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

  it("resetProjectChat clears only the selected project's input and thinking state", () => {
    const store = useChatStore.getState();

    store.setInputMessage("project-a", "待清空");
    store.setInputMessage("project-b", "保留");
    store.setIsThinking("project-a", true);
    store.setIsThinking("project-b", true);

    store.resetProjectChat("project-a", welcomeMessage);

    const state = useChatStore.getState();
    expect(state.getInputMessage("project-a")).toBe("");
    expect(state.getInputMessage("project-b")).toBe("保留");
    expect(state.getIsThinking("project-a")).toBe(false);
    expect(state.getIsThinking("project-b")).toBe(true);
    expect(state.getMessages("project-a")).toEqual([welcomeMessage]);
  });
});
