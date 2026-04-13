import { Bot, Sparkles } from "lucide-react";
import { useProject } from "@/features/project";

export function ChatHeader() {
  const { currentProject } = useProject();

  return (
    <div className="shrink-0 border-b border-apm bg-[hsl(var(--apm-bg-overlay))/0.68] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[linear-gradient(135deg,hsl(var(--apm-accent)),hsl(var(--apm-accent-strong)))] text-[#041225] shadow-apm-glow">
          <Bot className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold text-white">AI 助手</span>
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          </div>
          <div className="truncate text-[11px] text-apm-muted">
            {currentProject?.name ?? "未选择项目"}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          在线
        </div>
      </div>
    </div>
  );
}
