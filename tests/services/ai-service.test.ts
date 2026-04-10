import { describe, expect, it } from "vitest";
import { extractChatMessageContent } from "@/features/ai/services/ai-service";

describe("ai-service extractChatMessageContent", () => {
  describe("refetch type", () => {
    it("returns shouldRefetch true for refetch type", () => {
      const result = extractChatMessageContent({ type: "refetch" });
      expect(result.content).toBeNull();
      expect(result.type).toBe("refetch");
      expect(result.shouldRefetch).toBe(true);
    });
  });

  describe("verify type", () => {
    it("builds verify message for adjust_project", () => {
      const result = extractChatMessageContent({
        type: "verify",
        data: {
          verify_type: "adjust_project",
          target_date: "2025-06-01",
          finish_date: "2025-05-15",
        },
      });
      expect(result.type).toBe("verify");
      expect(result.content).toContain("项目工期调整验证");
      expect(result.content).toContain("2025-06-01");
      expect(result.content).toContain("2025-05-15");
    });

    it("builds verify message for adjust_task", () => {
      const result = extractChatMessageContent({
        type: "verify",
        data: {
          verify_type: "adjust_task",
          task_name: "浇筑混凝土",
          finish_date: "2025-04-20",
        },
      });
      expect(result.type).toBe("verify");
      expect(result.content).toContain("任务工期调整验证");
      expect(result.content).toContain("浇筑混凝土");
    });

    it("builds verify message for unexpected_event", () => {
      const result = extractChatMessageContent({
        type: "verify",
        data: {
          verify_type: "unexpected_event",
          intent: "延长工期",
          affected_task_ids: ["task-1", "task-2"],
        },
      });
      expect(result.type).toBe("verify");
      expect(result.content).toContain("突发事件验证");
      expect(result.content).toContain("延长工期");
    });

    it("handles unknown verify type", () => {
      const result = extractChatMessageContent({
        type: "verify",
        data: { verify_type: "unknown_type" },
      });
      expect(result.type).toBe("verify");
      expect(result.content).toContain("unknown_type");
    });

    it("returns null content for verify with no data", () => {
      const result = extractChatMessageContent({ type: "verify" });
      expect(result.type).toBe("verify");
      expect(result.content).toBeNull();
    });
  });

  describe("update type", () => {
    it("extracts message from update type", () => {
      const result = extractChatMessageContent({
        type: "update",
        message: "任务进度已更新",
      });
      expect(result.type).toBe("update");
      expect(result.content).toBe("任务进度已更新");
    });

    it("extracts data string from update type", () => {
      const result = extractChatMessageContent({
        type: "update",
        data: "数据内容",
      });
      expect(result.type).toBe("update");
      expect(result.content).toBe("数据内容");
    });

    it("extracts from nested messages in update type", () => {
      const result = extractChatMessageContent({
        type: "update",
        data: {
          project_info_query: {
            messages: [
              { type: "user", content: "hello" },
              { type: "tool", content: "tool result" },
              { type: "assistant", content: "final response" },
            ],
          },
        },
      });
      expect(result.type).toBe("update");
      expect(result.content).toBe("final response");
    });

    it("skips tool messages when extracting from nested", () => {
      const result = extractChatMessageContent({
        type: "update",
        data: {
          knowledge_query: {
            messages: [
              { type: "tool", content: "should skip" },
              { type: "system", content: "also skip" },
              { type: "assistant", content: "valid content" },
            ],
          },
        },
      });
      expect(result.content).toBe("valid content");
    });
  });

  describe("interrupt type", () => {
    it("extracts interrupt message", () => {
      const result = extractChatMessageContent({
        type: "interrupt",
        message: "等待用户确认",
      });
      expect(result.type).toBe("interrupt");
      expect(result.content).toBe("等待用户确认");
    });

    it("extracts interrupt from data field", () => {
      const result = extractChatMessageContent({
        type: "interrupt",
        data: "中断数据",
      });
      expect(result.type).toBe("interrupt");
      expect(result.content).toBe("中断数据");
    });
  });

  describe("routed messages", () => {
    it("extracts from knowledge_query route", () => {
      const result = extractChatMessageContent({
        knowledge_query: {
          messages: [{ type: "assistant", content: "知识查询结果" }],
        },
      });
      expect(result.type).toBe("routed");
      expect(result.content).toBe("知识查询结果");
    });

    it("extracts from project_info_query route", () => {
      const result = extractChatMessageContent({
        project_info_query: {
          messages: [{ type: "assistant", content: "项目信息" }],
        },
      });
      expect(result.type).toBe("routed");
      expect(result.content).toBe("项目信息");
    });

    it("extracts from conversation route", () => {
      const result = extractChatMessageContent({
        conversation: {
          messages: [{ type: "assistant", content: "对话内容" }],
        },
      });
      expect(result.type).toBe("routed");
      expect(result.content).toBe("对话内容");
    });
  });

  describe("__interrupt__ field", () => {
    it("extracts from __interrupt__ array with string", () => {
      const result = extractChatMessageContent({
        __interrupt__: ["Interrupt(value='中断内容', id='123')"],
      });
      expect(result.type).toBe("interrupt");
      expect(result.content).toBe("中断内容");
    });

    it("extracts from __interrupt__ array with object", () => {
      const result = extractChatMessageContent({
        __interrupt__: [{ value: "中断对象内容" }],
      });
      expect(result.type).toBe("interrupt");
      expect(result.content).toBe("中断对象内容");
    });

    it("handles __interrupt__ with newlines in value", () => {
      const result = extractChatMessageContent({
        __interrupt__: ["Interrupt(value='line1\\nline2', id='123')"],
      });
      expect(result.content).toBe("line1\nline2");
    });
  });

  describe("edge cases", () => {
    it("returns null content for null input", () => {
      const result = extractChatMessageContent(null);
      expect(result.content).toBeNull();
    });

    it("returns null content for undefined input", () => {
      const result = extractChatMessageContent(undefined);
      expect(result.content).toBeNull();
    });

    it("returns null content for primitive input", () => {
      expect(extractChatMessageContent("string" as unknown as object).content).toBeNull();
      expect(extractChatMessageContent(123 as unknown as object).content).toBeNull();
    });

    it("returns null content when no pattern matches", () => {
      const result = extractChatMessageContent({ some: "unknown structure" });
      expect(result.content).toBeNull();
    });

    it("returns null when route has empty messages", () => {
      const result = extractChatMessageContent({
        knowledge_query: { messages: [] },
      });
      expect(result.content).toBeNull();
    });
  });
});
