import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocsTabProps {
  /** 后端返回的施工组织设计 markdown 文档 */
  content: string;
  /** 是否可编辑（暂未实现） */
  editable?: boolean;
}

export function DocsTab({ content, editable = false }: DocsTabProps) {
  return (
    <div className="flex h-full flex-col">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 border-b border-cyan-400/18 bg-apm-card px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11px] text-apm-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/90" />
          施工组织设计文档
        </span>
        {editable && (
          <button className="flex items-center gap-1 border border-cyan-400/18 px-2 py-1 text-[11px] text-apm-muted transition hover:border-cyan-400 hover:text-cyan-400">
            编辑
          </button>
        )}
      </div>

      {/* Markdown 内容 */}
      <div className="flex-1 overflow-y-auto px-5 py-6 text-[13px] leading-[1.95] text-[rgba(200,215,235,0.82)] lg:px-8 lg:py-7 prose prose-invert prose-cyan max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
