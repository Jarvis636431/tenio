import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initAgentSession, sendAgentSessionMessage, subscribeAgentStreamSse } from "@/features/ai";

describe("ai-api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("sends agent ticket when initializing a session", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            current_session: {
              chat_session_id: "session-001",
              session_title: "新会话",
              session_status: "active",
              last_message_at: null,
            },
          },
        }),
    } as Response);

    await initAgentSession(
      {
        product_code: "apm",
        project_id: "project-001",
        agent_ticket: "agent-ticket-001",
      },
      {
        agentBaseUrl: "https://agent.example.com",
        agentTicket: "agent-ticket-001",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith("https://agent.example.com/api/agent/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer agent-ticket-001",
      },
      body: JSON.stringify({
        product_code: "apm",
        project_id: "project-001",
        agent_ticket: "agent-ticket-001",
      }),
    });
  });

  it("normalizes current_session from init response", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            product_code: "apm",
            project_id: "project-001",
            user_id: "user-001",
            current_session: {
              chat_session_id: "chat-001",
              session_title: "新会话",
              session_status: "active",
              last_message_at: null,
            },
            capabilities: {
              can_chat: true,
              can_read_session: true,
              can_read_kb: true,
              can_invoke_action: true,
            },
            client_type: "web",
          },
        }),
    } as Response);

    const session = await initAgentSession(
      {
        product_code: "apm",
        project_id: "project-001",
        agent_ticket: "agent-ticket-001",
      },
      {
        agentBaseUrl: "https://agent.example.com",
        agentTicket: "agent-ticket-001",
      },
    );

    expect(session).toEqual({
      chat_session_id: "chat-001",
    });
  });

  it("sends agent ticket when posting a session message", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            message_id: "message-001",
            message_role: "user",
            message_type: "text",
            content_text: "压缩工期",
            sent_at: "2026-05-01T00:00:00.000Z",
            stream_id: "stream-001",
          },
        }),
    } as Response);

    await sendAgentSessionMessage(
      "session-001",
      { content_text: "压缩工期" },
      {
        agentBaseUrl: "https://agent.example.com",
        agentTicket: "agent-ticket-001",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://agent.example.com/api/agent/sessions/session-001/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer agent-ticket-001",
        },
        body: JSON.stringify({ content_text: "压缩工期" }),
      },
    );
  });

  it("sends agent ticket when subscribing to stream SSE", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response("data: [DONE]\n\n", { status: 200 }));

    await subscribeAgentStreamSse("stream-001", {
      agentBaseUrl: "https://agent.example.com",
      agentTicket: "agent-ticket-001",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://agent.example.com/api/agent/streams/stream-001/sse",
      {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          Authorization: "Bearer agent-ticket-001",
        },
        body: undefined,
        signal: undefined,
      },
    );
  });
});
