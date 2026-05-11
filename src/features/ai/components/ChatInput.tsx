import type { ComponentType, KeyboardEvent } from "react";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuickQuery {
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  isThinking: boolean;
  handleSendMessage: () => Promise<void> | void;
  handleInputEnter: (e: KeyboardEvent<HTMLInputElement>) => void;
  sendQuickMessage: (message: string) => Promise<void> | void;
  quickQueries: QuickQuery[];
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  isThinking,
  handleSendMessage,
  handleInputEnter,
  sendQuickMessage,
  quickQueries,
}: ChatInputProps) {
  return (
    <div className="shrink-0 border-t border-apm bg-[hsl(var(--apm-bg-overlay))/0.42]">
      <div className="px-4 pb-2 pt-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-apm-dim">
          常用操作
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickQueries.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.label}
                type="button"
                variant="ghost"
                onClick={() => {
                  void sendQuickMessage(item.label);
                }}
                className="h-7 w-auto justify-start gap-1 rounded-sm border border-white/[0.08] bg-cyan-400/4 px-2 text-apm-muted hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100"
              >
                <Icon className="h-2.5 w-2.5 text-cyan-300" />
                <span className="truncate text-[10px]">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="rounded-sm border border-white/[0.08] bg-[rgba(0,212,255,0.04)] px-3 py-3 shadow-[inset_0_0_0_1px_rgba(8,145,178,0.14)]">
          <Input
            placeholder="输入问题..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleInputEnter}
            aria-label="输入调整指令"
            className="h-9 border-0 bg-transparent px-0 text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="附件"
                className="h-9 w-9 rounded-sm border border-white/[0.08] bg-[#051a3d] text-slate-200 hover:bg-[#0a2a5c]"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => {
                void handleSendMessage();
              }}
              size="icon"
              disabled={!inputMessage.trim() || isThinking}
              className="h-10 w-10 rounded-sm bg-[linear-gradient(135deg,hsl(var(--apm-accent)),hsl(var(--apm-accent-strong)))] text-[#041225] hover:opacity-90 disabled:bg-slate-700/40 disabled:text-slate-400"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
