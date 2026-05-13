import { describe, expect, it } from "vitest";
import { analyticsEnvelopeSchema, parseAnalyticsPayload } from "@/analytics";

describe("analytics schema", () => {
  it("parses valid page_view envelopes", () => {
    const result = analyticsEnvelopeSchema.parse({
      name: "page_view",
      payload: {
        path: "/projects",
        title: "项目控制台",
      },
      context: {
        sessionId: "session-1",
      },
      timestamp: new Date().toISOString(),
    });

    expect(result.name).toBe("page_view");
    expect(result.payload.path).toBe("/projects");
  });

  it("rejects invalid payloads for an event", () => {
    expect(() =>
      parseAnalyticsPayload("upload_select_file", {
        fileCount: -1,
      }),
    ).toThrow();
  });
});
