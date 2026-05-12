export type ProjectDocumentBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "listItem"; text: string }
  | { type: "table"; rows: string[][] };

/**
 * 去除施工组织设计 markdown 前置的重复标题、目录和分隔线。
 *
 * @param content - 后端返回的原始 markdown 文本
 * @returns 去除前置内容后的正文 markdown
 */
export function stripDocumentPrelude(content: string): string {
  return content
    .trimStart()
    .replace(/^#\s+.*(?:\r?\n)+/, "")
    .replace(/^##\s*目录[\s\S]*?(?=\r?\n---\r?\n|\r?\n#\s+)/, "")
    .replace(/^\s*---\s*/, "")
    .trimStart();
}

/**
 * 将施工组织设计 markdown 解析为可复用的结构化块。
 *
 * @param content - 后端返回的原始 markdown 文本
 * @returns 标题、段落、列表和表格组成的结构化块
 */
export function parseProjectDocumentBlocks(content: string): ProjectDocumentBlock[] {
  const blocks: ProjectDocumentBlock[] = [];
  const tableBuffer: string[] = [];
  const lines = stripDocumentPrelude(content).split(/\r?\n/);

  const flushTable = () => {
    if (tableBuffer.length === 0) return;

    if (tableBuffer.length >= 2 && /^\s*\|?\s*:?-{3,}:?\s*\|/.test(tableBuffer[1])) {
      blocks.push({
        type: "table",
        rows: tableBuffer
          .slice(0, 1)
          .concat(tableBuffer.slice(2))
          .map((line) =>
            line
              .trim()
              .replace(/^\|/, "")
              .replace(/\|$/, "")
              .split("|")
              .map((cell) => stripInlineMarkdown(cell)),
          ),
      });
    } else {
      tableBuffer.forEach((line) => {
        blocks.push({ type: "paragraph", text: stripInlineMarkdown(line) });
      });
    }

    tableBuffer.length = 0;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (tableBuffer.length > 0 && !trimmed.includes("|")) {
      flushTable();
    }

    if (!trimmed) {
      flushTable();
      return;
    }

    if (trimmed.includes("|") && /^\|?(.+\|)+.+\|?$/.test(trimmed)) {
      tableBuffer.push(trimmed);
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushTable();
      blocks.push({
        type: "heading",
        level: Math.min(headingMatch[1].length, 4) as 1 | 2 | 3 | 4,
        text: stripInlineMarkdown(headingMatch[2]),
      });
      return;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushTable();
      blocks.push({ type: "listItem", text: stripInlineMarkdown(unorderedMatch[1]) });
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushTable();
      blocks.push({ type: "listItem", text: stripInlineMarkdown(orderedMatch[1]) });
      return;
    }

    if (/^---+$/.test(trimmed)) {
      flushTable();
      return;
    }

    blocks.push({ type: "paragraph", text: stripInlineMarkdown(trimmed) });
  });

  flushTable();
  return blocks;
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}
