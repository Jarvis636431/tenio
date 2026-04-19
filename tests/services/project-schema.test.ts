import { describe, expect, it } from "vitest";
import {
  costCurveResponseSchema,
  legacyCostCurveResponseSchema,
  projectListResponseSchema,
} from "@/features/project";

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

  it("parses current cost curve responses", () => {
    const result = costCurveResponseSchema.parse({
      project_id: "p-001",
      days: [1, 2],
      dates: ["2026-04-20", "2026-04-21"],
      total_costs: [1000, 2000],
    });

    expect(result.total_costs[1]).toBe(2000);
  });

  it("parses legacy cost curve responses", () => {
    const result = legacyCostCurveResponseSchema.parse({
      project_id: "p-001",
      points: [
        {
          date: "2026-04-20",
          total_cost: 1000,
        },
      ],
    });

    expect(result.points[0].total_cost).toBe(1000);
  });
});
