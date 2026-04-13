import { describe, expect, it } from "vitest";
import { getFileStats } from "@/features/upload";

describe("uploads-api helpers", () => {
  describe("getFileStats", () => {
    it("groups project files by category", async () => {
      const result = await getFileStats("project-001");

      expect(result.totalFiles).toBe(5);
      expect(result.totalSize).toBe(38_100_000);

      const documentStats = result.categories.find((item) => item.category === "document");
      expect(documentStats).toEqual({
        category: "document",
        count: 1,
        totalSize: 1_200_000,
      });

      const photoStats = result.categories.find((item) => item.category === "photo");
      expect(photoStats).toEqual({
        category: "photo",
        count: 1,
        totalSize: 3_800_000,
      });
    });

    it("returns empty category stats for unknown project", async () => {
      const result = await getFileStats("missing-project");
      expect(result).toEqual({
        totalFiles: 0,
        totalSize: 0,
        categories: [],
      });
    });

    it("aggregates each category with the mocked source of truth", async () => {
      const result = await getFileStats("project-001");

      expect(result.categories).toEqual(
        expect.arrayContaining([
          { category: "drawing", count: 1, totalSize: 2_500_000 },
          { category: "document", count: 1, totalSize: 1_200_000 },
          { category: "photo", count: 1, totalSize: 3_800_000 },
          { category: "contract", count: 1, totalSize: 5_600_000 },
          { category: "bim", count: 1, totalSize: 25_000_000 },
        ]),
      );
    });
  });
});
