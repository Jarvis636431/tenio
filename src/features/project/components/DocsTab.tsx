import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Edit3, FileText, List } from "lucide-react";
import type { DocumentArtifact } from "../types";

interface DocsTabProps {
  /** 后端返回的施工组织设计 markdown 文档 */
  content: string;
  /** 后端返回的 document 产物元信息 */
  artifact?: DocumentArtifact;
  /** 是否可编辑（暂未实现） */
  editable?: boolean;
}

function stripDocumentPrelude(content: string) {
  return content
    .trimStart()
    .replace(/^#\s+.*(?:\r?\n)+/, "")
    .replace(/^##\s*目录[\s\S]*?(?=\r?\n---\r?\n|\r?\n#\s+)/, "")
    .replace(/^\s*---\s*/, "")
    .trimStart();
}

export function DocsTab({
  content,
  artifact,
  editable = artifact?.can_edit ?? false,
}: DocsTabProps) {
  const title = artifact?.document_title ?? "施工组织设计文档";
  const meta = [
    typeof artifact?.word_count === "number"
      ? `约 ${artifact.word_count.toLocaleString()} 字`
      : null,
    typeof artifact?.chapter_count === "number" ? `${artifact.chapter_count} 章节` : null,
  ].filter(Boolean);
  const bodyContent = stripDocumentPrelude(content);
  const tocItems = artifact?.toc_items ?? [];

  return (
    <div className="flex h-full flex-col gap-3">
      {/* 工具栏 */}
      <div className="flex shrink-0 items-center gap-2 border border-cyan-400/18 bg-apm-card px-[13px] py-[9px]">
        <span className="flex items-center gap-1.5 text-[11px] text-apm-muted">
          <FileText className="h-3 w-3 text-cyan-400" />
          施工组织设计文档
        </span>
        {editable && (
          <button
            type="button"
            className="flex items-center gap-1 border border-cyan-400/18 bg-transparent px-[9px] py-1 text-[11px] text-apm-muted transition hover:border-cyan-400 hover:text-cyan-400"
          >
            <Edit3 className="h-3 w-3" />
            编辑
          </button>
        )}
        {meta.length > 0 && (
          <span className="ml-auto text-[10px] text-apm-dim">{meta.join(" · ")}</span>
        )}
      </div>

      {/* Markdown 内容 */}
      <div className="flex-1 overflow-y-auto border border-cyan-400/18 bg-white/[0.015] px-5 py-6 text-[13px] leading-[1.95] text-[rgba(200,215,235,0.82)] lg:px-9 lg:py-7">
        <h1 className="mb-[18px] border-b border-cyan-400/18 pb-3 text-center text-lg font-bold text-white">
          {title}
        </h1>

        {tocItems.length > 0 && (
          <div className="mb-[18px] border border-cyan-400/18 bg-[rgba(0,20,55,0.4)] px-[18px] py-3.5">
            <div className="mb-2 flex items-center text-[11px] font-bold tracking-[0.1em] text-cyan-400">
              <List className="mr-1.5 h-3 w-3" />
              目录
            </div>
            <ol className="ml-6 list-decimal">
              {tocItems.map((item) => (
                <li
                  key={`${item.order_no}-${item.title}`}
                  className="mb-[3px] text-xs text-apm-muted transition hover:text-cyan-400"
                >
                  {item.title}
                </li>
              ))}
            </ol>
          </div>
        )}

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="mb-[18px] border-b border-cyan-400/18 pb-3 text-center text-lg font-bold text-white">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-[9px] mt-[22px] flex items-center gap-[7px] text-sm font-bold text-cyan-400">
                <span className="h-3.5 w-[3px] shrink-0 bg-cyan-400" />
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-[7px] mt-3.5 text-[13px] font-semibold text-[#dde8f8]">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="mb-[5px] mt-2.5 text-xs font-semibold text-[rgba(200,215,235,0.9)]">
                {children}
              </h4>
            ),
            p: ({ children }) => <p className="mb-[9px] indent-[2em]">{children}</p>,
            ul: ({ children }) => <ul className="mb-[9px] ml-[2em] list-disc">{children}</ul>,
            ol: ({ children }) => <ol className="mb-[9px] ml-[2em] list-decimal">{children}</ol>,
            li: ({ children }) => <li className="mb-[3px]">{children}</li>,
            table: ({ children }) => (
              <table className="my-2.5 w-full border-collapse text-xs">{children}</table>
            ),
            th: ({ children }) => (
              <th className="border border-cyan-400/18 bg-cyan-400/[0.07] px-[9px] py-1.5 text-center font-semibold text-cyan-400">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-cyan-400/[0.09] px-[9px] py-[5px]">{children}</td>
            ),
          }}
        >
          {bodyContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
