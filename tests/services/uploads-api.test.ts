import { describe, expect, it } from "vitest";
import type { ProjectFile, FileCategory } from "@/features/project/types/uploads";

// Replicate the helper function to test it in isolation
function groupByCategory(files: ProjectFile[]) {
  const stats: Record<string, { count: number; totalSize: number }> = {};

  for (const file of files) {
    const cat = file.category;
    if (!stats[cat]) {
      stats[cat] = { count: 0, totalSize: 0 };
    }
    stats[cat].count++;
    stats[cat].totalSize += file.size;
  }

  return Object.entries(stats).map(([category, data]) => ({
    category: category as FileCategory,
    ...data,
  }));
}

describe("uploads-api helpers", () => {
  describe("groupByCategory", () => {
    it("groups files by category", () => {
      const files: ProjectFile[] = [
        {
          id: "1",
          projectId: "p-001",
          name: "file1.pdf",
          originalName: "file1.pdf",
          size: 1000,
          type: "application/pdf",
          category: "document",
          url: "/f1",
          uploadedBy: "user1",
          uploadedAt: "2024-01-01",
          status: "completed",
        },
        {
          id: "2",
          projectId: "p-001",
          name: "file2.jpg",
          originalName: "file2.jpg",
          size: 2000,
          type: "image/jpeg",
          category: "photo",
          url: "/f2",
          uploadedBy: "user1",
          uploadedAt: "2024-01-01",
          status: "completed",
        },
        {
          id: "3",
          projectId: "p-001",
          name: "file3.pdf",
          originalName: "file3.pdf",
          size: 1500,
          type: "application/pdf",
          category: "document",
          url: "/f3",
          uploadedBy: "user2",
          uploadedAt: "2024-01-01",
          status: "completed",
        },
      ];

      const result = groupByCategory(files);

      expect(result).toHaveLength(2);

      const docStats = result.find((r) => r.category === "document");
      expect(docStats).toEqual({ category: "document", count: 2, totalSize: 2500 });

      const photoStats = result.find((r) => r.category === "photo");
      expect(photoStats).toEqual({ category: "photo", count: 1, totalSize: 2000 });
    });

    it("handles empty array", () => {
      const result = groupByCategory([]);
      expect(result).toEqual([]);
    });

    it("handles single file", () => {
      const files: ProjectFile[] = [
        {
          id: "1",
          projectId: "p-001",
          name: "single.pdf",
          originalName: "single.pdf",
          size: 5000,
          type: "application/pdf",
          category: "bim",
          url: "/single",
          uploadedBy: "user1",
          uploadedAt: "2024-01-01",
          status: "completed",
        },
      ];

      const result = groupByCategory(files);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ category: "bim", count: 1, totalSize: 5000 });
    });

    it("accumulates totalSize correctly", () => {
      const files: ProjectFile[] = [
        {
          id: "1",
          projectId: "p-001",
          name: "a.pdf",
          originalName: "a.pdf",
          size: 100,
          type: "application/pdf",
          category: "contract",
          url: "/a",
          uploadedBy: "user1",
          uploadedAt: "2024-01-01",
          status: "completed",
        },
        {
          id: "2",
          projectId: "p-001",
          name: "b.pdf",
          originalName: "b.pdf",
          size: 200,
          type: "application/pdf",
          category: "contract",
          url: "/b",
          uploadedBy: "user1",
          uploadedAt: "2024-01-01",
          status: "completed",
        },
        {
          id: "3",
          projectId: "p-001",
          name: "c.pdf",
          originalName: "c.pdf",
          size: 300,
          type: "application/pdf",
          category: "contract",
          url: "/c",
          uploadedBy: "user1",
          uploadedAt: "2024-01-01",
          status: "completed",
        },
      ];

      const result = groupByCategory(files);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ category: "contract", count: 3, totalSize: 600 });
    });
  });
});
