import { describe, expect, it } from "vitest";
import { parseProjectDocumentBlocks, stripDocumentPrelude } from "@/lib/project-document";

describe("project-document", () => {
  it("strips duplicated title, toc and divider from document prelude", () => {
    const content = `# 施工组织设计

## 目录
- 第一章
- 第二章

---

## 第一章
正文`;

    expect(stripDocumentPrelude(content)).toBe("## 第一章\n正文");
  });

  it("parses headings, paragraphs, lists and tables consistently", () => {
    const content = `## 第一章
正文段落
- 要点一
1. 要点二
| 字段 | 值 |
| --- | --- |
| 工期 | 30天 |`;

    expect(parseProjectDocumentBlocks(content)).toEqual([
      { type: "heading", level: 2, text: "第一章" },
      { type: "paragraph", text: "正文段落" },
      { type: "listItem", text: "要点一" },
      { type: "listItem", text: "要点二" },
      {
        type: "table",
        rows: [
          ["字段", "值"],
          ["工期", "30天"],
        ],
      },
    ]);
  });
});
