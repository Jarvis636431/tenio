import { Loader2, Mic, Paperclip, Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuickQuery {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  isRecording: boolean;
  isRecognizing: boolean;
  isThinking: boolean;
  handleSendMessage: () => Promise<void> | void;
  handleInputEnter: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  toggleRecording: () => Promise<void> | void;
  sendQuickMessage: (message: string) => Promise<void> | void;
  quickQueries: QuickQuery[];
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  isRecording,
  isRecognizing,
  isThinking,
  handleSendMessage,
  handleInputEnter,
  toggleRecording,
  sendQuickMessage,
  quickQueries,
}: ChatInputProps) {
  return (
    <div className="block shrink-0 px-4 py-3">
      <div className="mb-3 w-full">
        <div className="mb-2 text-xs font-semibold text-cyan-200">常用查询</div>
        <div className="flex flex-wrap gap-2">
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
                className="h-7 w-auto justify-start gap-1 rounded-full border border-cyan-900/60 bg-[#03112a] px-2 text-cyan-200 hover:bg-[#0a2a5c]"
              >
                <Icon className="h-2.5 w-2.5 text-cyan-300" />
                <span className="truncate text-[10px]">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
      <div className="w-full rounded-2xl border border-cyan-900/70 bg-[#02102a] px-3 py-3 shadow-[inset_0_0_0_1px_rgba(8,145,178,0.18)]">
        <Input
          placeholder="想查点什么？（Enter 发送）"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleInputEnter}
          aria-label="输入调整指令"
          className="h-9 border-0 bg-transparent px-0 text-slate-100 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="附件"
              className="h-9 w-9 rounded-xl border border-cyan-900/70 bg-[#051a3d] text-slate-200 hover:bg-[#0a2a5c]"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                void toggleRecording();
              }}
              size="icon"
              variant="ghost"
              disabled={isRecognizing && !isRecording}
              aria-label={isRecording ? "结束录音" : "开始录音"}
              className={cn(
                "h-9 w-9 rounded-xl border border-cyan-900/70 bg-[#051a3d] text-slate-200 hover:bg-[#0a2a5c]",
                isRecording ? "border-red-400/70 bg-red-900/30 text-red-100 animate-pulse" : "",
              )}
              style={isRecording ? { animationDuration: "1.6s" } : undefined}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
          <Button
            onClick={() => {
              void handleSendMessage();
            }}
            size="icon"
            disabled={!inputMessage.trim() || isThinking}
            className="h-10 w-10 rounded-xl bg-[#1d4e89] text-[#cfe8ff] hover:bg-[#286ab8] disabled:bg-slate-700/40 disabled:text-slate-400"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {isRecognizing && (
        <div className="mt-2 flex items-center gap-2 text-xs text-cyan-300/70">
          <Loader2 className="h-3 w-3 animate-spin" />
          正在识别语音，识别结果会填入输入框
        </div>
      )}
    </div>
  );
}
