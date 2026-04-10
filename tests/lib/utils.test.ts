import { describe, expect, it } from "vitest";
import { cn, formatFileSize } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names with tailwind-merge", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toContain("text-red-500");
      expect(result).toContain("bg-blue-500");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const isHidden = false;
      const result = cn(isActive && "active", isHidden && "hidden");
      expect(result).toBe("active");
    });

    it("handles empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("", null, undefined)).toBe("");
    });
  });

  describe("formatFileSize", () => {
    it("formats bytes", () => {
      expect(formatFileSize(0)).toBe("0 B");
      expect(formatFileSize(500)).toBe("500 B");
    });

    it("formats KB", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });

    it("formats MB", () => {
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(5242880)).toBe("5 MB");
    });

    it("formats GB", () => {
      expect(formatFileSize(1073741824)).toBe("1 GB");
    });
  });
});
