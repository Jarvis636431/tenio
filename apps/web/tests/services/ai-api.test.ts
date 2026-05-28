import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAgentSession,
  sendAgentSessionMessage,
  subscribeAgentStreamSse,
} from "@/features/ai";

describe("ai-api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("creates an agent session under project-scoped backend route", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            current_session: {
              id: "session-001",
              title: "新会话",
              status: "active",
              last_message_at: null,
            },
          },
        }),
    } as Response);

    await createAgentSession("project-001", { session_title: "方案讨论" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects/project-001/agent/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_title: "方案讨论" }),
      },
    );
  });

  it("sends a session message through the backend agent route", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            id: "message-001",
            role: "user",
            type: "text",
            content: "压缩工期",
            sent_at: "2026-05-01T00:00:00.000Z",
            stream_id: "stream-001",
          },
        }),
    } as Response);

    await sendAgentSessionMessage("project-001", "session-001", { content: "压缩工期" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects/project-001/agent/sessions/session-001/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "压缩工期" }),
      },
    );
  });

  it("subscribes to project-scoped stream SSE", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response("data: [DONE]\n\n", { status: 200 }));

    await subscribeAgentStreamSse("project-001", "stream-001");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects/project-001/agent/streams/stream-001/sse",
      {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
        },
        body: undefined,
        signal: undefined,
      },
    );
  });
});
