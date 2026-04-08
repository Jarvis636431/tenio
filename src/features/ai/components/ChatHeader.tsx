import { Sparkles } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface ChatHeaderProps {
  mode: "query" | "schedule";
  onModeChange: (mode: "query" | "schedule") => void;
}

export function ChatHeader({ mode, onModeChange }: ChatHeaderProps) {
  return (
    <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-lg font-bold flex items-center gap-2 text-cyan-100">
        <Sparkles className="w-5 h-5 text-cyan-300" />
        AI助手
      </CardTitle>
      <div className="inline-flex rounded-md border border-cyan-800/50 bg-[#03112a] p-0.5">
        <button
          type="button"
          onClick={() => onModeChange("query")}
          className={`h-6 rounded px-2 text-[11px] transition ${
            mode === "query"
              ? "bg-cyan-500/20 text-cyan-100"
              : "text-cyan-300/70 hover:text-cyan-200"
          }`}
        >
          查询模式
        </button>
        <button
          type="button"
          onClick={() => onModeChange("schedule")}
          className={`h-6 rounded px-2 text-[11px] transition ${
            mode === "schedule"
              ? "bg-cyan-500/20 text-cyan-100"
              : "text-cyan-300/70 hover:text-cyan-200"
          }`}
        >
          调度模式
        </button>
      </div>
    </CardHeader>
  );
}
