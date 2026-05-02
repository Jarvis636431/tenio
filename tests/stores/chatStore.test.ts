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
      agentTicketByProject: {},
      agentTicketExpiresAtByProject: {},
      agentTicketRefreshAtByProject: {},
      agentTicketProjectIdByProject: {},
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

  it("keeps agent tickets isolated by project", () => {
    const store = useChatStore.getState();

    store.setAgentTicket("project-a", "ticket-a", {
      expiresAt: "2026-01-01T00:15:00.000Z",
      refreshAt: "2026-01-01T00:12:00.000Z",
      projectId: "project-a",
    });
    store.setAgentTicket("project-b", "ticket-b");

    expect(useChatStore.getState().getAgentTicket("project-a")).toBe("ticket-a");
    expect(useChatStore.getState().getAgentTicket("project-b")).toBe("ticket-b");
    expect(useChatStore.getState().getAgentTicket("project-c")).toBeNull();
    expect(useChatStore.getState().getAgentTicketInfo("project-a")).toEqual({
      agentTicket: "ticket-a",
      expiresAt: "2026-01-01T00:15:00.000Z",
      refreshAt: "2026-01-01T00:12:00.000Z",
      projectId: "project-a",
    });
    expect(useChatStore.getState().getAgentTicketInfo("project-b")).toBeNull();
  });

  it("resetProjectChat clears only the selected project's input and thinking state", () => {
    const store = useChatStore.getState();

    store.setInputMessage("project-a", "待清空");
    store.setInputMessage("project-b", "保留");
    store.setIsThinking("project-a", true);
    store.setIsThinking("project-b", true);
    store.setAgentTicket("project-a", "ticket-a");
    store.setAgentTicket("project-b", "ticket-b");

    store.resetProjectChat("project-a", welcomeMessage);

    const state = useChatStore.getState();
    expect(state.getInputMessage("project-a")).toBe("");
    expect(state.getInputMessage("project-b")).toBe("保留");
    expect(state.getIsThinking("project-a")).toBe(false);
    expect(state.getIsThinking("project-b")).toBe(true);
    expect(state.getAgentTicket("project-a")).toBeNull();
    expect(state.getAgentTicket("project-b")).toBe("ticket-b");
    expect(state.getAgentTicketInfo("project-a")).toBeNull();
    expect(state.getMessages("project-a")).toEqual([welcomeMessage]);
  });
});
