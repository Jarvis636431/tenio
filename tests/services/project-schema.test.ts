import { describe, expect, it } from "vitest";
import { projectListResponseSchema } from "@/features/project";

describe("project schema", () => {
  it("parses project list responses", () => {
    const result = projectListResponseSchema.parse([
      {
        project_id: "p-001",
        project_name: "测试项目",
        status: "active",
        created_at: "2026-04-20T00:00:00.000Z",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].project_id).toBe("p-001");
  });
});
