import { useState } from "react";
import { ChevronUp, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatConsoleProps {
  items: Array<{
    text: string;
    tone: "success" | "info";
  }>;
}

export function ChatConsole({ items }: ChatConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="shrink-0 border-t border-apm bg-[hsl(var(--apm-bg-overlay))/0.56]">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-4 py-2 transition-colors hover:bg-white/5"
      >
        <Terminal className="h-3.5 w-3.5 text-cyan-300" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-apm-dim">
          控制台
        </span>
        <ChevronUp
          className={cn(
            "ml-auto h-3.5 w-3.5 text-apm-dim transition-transform",
            !isExpanded && "rotate-180",
          )}
        />
      </button>

      {isExpanded && (
        <div className="space-y-1 px-4 pb-3 text-[11px]">
          {items.map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-apm-muted">
              <span
                className={cn("h-1.5 w-1.5 rounded-full", {
                  "bg-emerald-400": item.tone === "success",
                  "bg-cyan-300": item.tone === "info",
                })}
              />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
