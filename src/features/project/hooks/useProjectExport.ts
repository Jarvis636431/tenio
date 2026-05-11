import type { DocumentArtifact } from "../types";

interface UseProjectExportOptions {
  projectName?: string;
}

const WORD_MIME_TYPE = "application/msword;charset=utf-8";

function normalizeFileName(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "apm-project";
  return trimmed.replace(/[\\/:*?"<>|]/g, "_");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripDocumentPrelude(content: string) {
  return content
    .trimStart()
    .replace(/^#\s+.*(?:\r?\n)+/, "")
    .replace(/^##\s*目录[\s\S]*?(?=\r?\n---\r?\n|\r?\n#\s+)/, "")
    .replace(/^\s*---\s*/, "")
    .trimStart();
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function renderMarkdownTable(lines: string[]) {
  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => renderInlineMarkdown(cell.trim())),
  );
  const [header = [], , ...body] = rows;

  return [
    "<table>",
    "<thead><tr>",
    ...header.map((cell) => `<th>${cell}</th>`),
    "</tr></thead>",
    "<tbody>",
    ...body.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`),
    "</tbody>",
    "</table>",
  ].join("");
}

function flushList(buffer: string[], html: string[]) {
  if (buffer.length === 0) return;
  html.push("<ul>");
  buffer.forEach((item) => {
    html.push(`<li>${renderInlineMarkdown(item)}</li>`);
  });
  html.push("</ul>");
  buffer.length = 0;
}

function flushTable(buffer: string[], html: string[]) {
  if (buffer.length === 0) return;
  if (buffer.length >= 2 && /^\s*\|?\s*:?-{3,}:?\s*\|/.test(buffer[1])) {
    html.push(renderMarkdownTable(buffer));
  } else {
    buffer.forEach((line) => {
      html.push(`<p>${renderInlineMarkdown(line)}</p>`);
    });
  }
  buffer.length = 0;
}

function markdownToWordHtml(content: string) {
  const html: string[] = [];
  const listBuffer: string[] = [];
  const tableBuffer: string[] = [];
  const lines = stripDocumentPrelude(content).split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (tableBuffer.length > 0 && !trimmed.includes("|")) {
      flushTable(tableBuffer, html);
    }

    if (!trimmed) {
      flushList(listBuffer, html);
      flushTable(tableBuffer, html);
      return;
    }

    if (trimmed.includes("|") && /^\|?(.+\|)+.+\|?$/.test(trimmed)) {
      flushList(listBuffer, html);
      tableBuffer.push(trimmed);
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList(listBuffer, html);
      flushTable(tableBuffer, html);
      const level = Math.min(headingMatch[1].length, 4);
      html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      return;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushTable(tableBuffer, html);
      listBuffer.push(unorderedMatch[1]);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushTable(tableBuffer, html);
      listBuffer.push(orderedMatch[1]);
      return;
    }

    if (/^---+$/.test(trimmed)) {
      flushList(listBuffer, html);
      flushTable(tableBuffer, html);
      html.push("<hr />");
      return;
    }

    flushList(listBuffer, html);
    flushTable(tableBuffer, html);
    html.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  });

  flushList(listBuffer, html);
  flushTable(tableBuffer, html);
  return html.join("\n");
}

function buildWordDocumentHtml(title: string, content: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: "Microsoft YaHei", SimSun, Arial, sans-serif; color: #111827; line-height: 1.8; }
    h1 { text-align: center; font-size: 22pt; margin: 0 0 24px; }
    h2 { font-size: 16pt; margin: 22px 0 10px; }
    h3 { font-size: 13pt; margin: 16px 0 8px; }
    h4 { font-size: 11pt; margin: 12px 0 6px; }
    p { font-size: 10.5pt; margin: 0 0 8px; text-indent: 2em; }
    ul { margin: 0 0 10px 28px; padding: 0; }
    li { font-size: 10.5pt; margin: 0 0 4px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
    th, td { border: 1px solid #9ca3af; padding: 6px 8px; vertical-align: top; }
    th { background: #e5edf7; font-weight: 700; }
    code { font-family: Consolas, monospace; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${markdownToWordHtml(content)}
</body>
</html>`;
}

function downloadWord(fileName: string, html: string) {
  const blob = new Blob(["\ufeff", html], {
    type: WORD_MIME_TYPE,
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * 提供项目工作台导出动作。
 *
 * @param documentArtifact - 当前项目的施工组织设计文档产物
 * @param options - 导出配置
 * @returns 导出动作和按钮状态
 */
export function useProjectExport(
  documentArtifact?: DocumentArtifact,
  options: UseProjectExportOptions = {},
) {
  const canExport = Boolean(documentArtifact?.content_markdown.trim());

  const handleExport = () => {
    if (!documentArtifact?.content_markdown.trim()) return;

    const baseName = normalizeFileName(options.projectName);
    const version = documentArtifact.artifact_version
      ? `-v${documentArtifact.artifact_version}`
      : "";
    const fileName = `${baseName}-施工组织设计${version}.doc`;
    const title = documentArtifact.document_title || `${options.projectName ?? "项目"}施工组织设计`;

    downloadWord(fileName, buildWordDocumentHtml(title, documentArtifact.content_markdown));
  };

  return { canExport, handleExport };
}
