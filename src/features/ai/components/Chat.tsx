import { useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  ChevronUp,
  CloudSun,
  Loader2,
  ShieldAlert,
  Terminal,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatState } from "@/features/ai";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";

interface ChatProps {
  state: ChatState;
  className?: string;
}

export function Chat({ state, className }: ChatProps) {
  const {
    messages,
    inputMessage,
    setInputMessage,
    isThinking,
    isRecording,
    isRecognizing,
    handleSendMessage,
    sendQuickMessage,
    resumeInterrupt,
    handleInputEnter,
    toggleRecording,
    scrollAreaRef,
  } = state;
  const [interruptDecisions, setInterruptDecisions] = useState<Record<string, "yes" | "no">>({});
  const quickQueries = [
    { label: "当前施工进度如何？", icon: BarChart3 },
    { label: "今日在场人数？", icon: Users },
    { label: "今天天气情况", icon: CloudSun },
    { label: "本周安全隐患", icon: ShieldAlert },
    { label: "材料库存状态", icon: Boxes },
    { label: "关键路径节点", icon: Zap },
  ];
  const consoleItems = useMemo(
    () => [
      { text: "项目上下文已加载", tone: "success" as const },
      {
        text: "AI 助手已就绪",
        tone: "info" as const,
      },
      {
        text: isThinking ? "AI 正在生成响应" : `消息线程已累计 ${messages.length} 条`,
        tone: isThinking ? ("info" as const) : ("success" as const),
      },
    ],
    [isThinking, messages.length],
  );

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-[rgba(2,12,27,0.6)] backdrop-blur-sm",
        className,
      )}
    >
      <ChatHeader />

      <div className="min-h-0 flex-1 overflow-hidden px-4">
        <div className="h-full min-h-0 overflow-y-auto" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isThinking={isThinking}
                interruptDecision={interruptDecisions[message.id]}
                onInterruptDecision={(messageId, decision) =>
                  setInterruptDecisions((prev) => ({ ...prev, [messageId]: decision }))
                }
                onResumeInterrupt={(response, confirmed) =>
                  void resumeInterrupt(response, confirmed)
                }
              />
            ))}
            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-cyan-300/70">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI 正在思考中...
              </div>
            )}
          </div>
        </div>
      </div>

      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        isRecording={isRecording}
        isRecognizing={isRecognizing}
        isThinking={isThinking}
        handleSendMessage={() => void handleSendMessage()}
        handleInputEnter={handleInputEnter}
        toggleRecording={() => void toggleRecording()}
        sendQuickMessage={(msg) => void sendQuickMessage(msg)}
        quickQueries={quickQueries}
      />

      <div className="shrink-0 border-t border-apm bg-[hsl(var(--apm-bg-overlay))/0.56]">
        <div className="flex items-center gap-2 px-4 py-2">
          <Terminal className="h-3.5 w-3.5 text-cyan-300" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-apm-dim">
            控制台
          </span>
          <ChevronUp className="ml-auto h-3.5 w-3.5 text-apm-dim" />
        </div>
        <div className="space-y-1 px-4 pb-3 text-[11px]">
          {consoleItems.map((item) => (
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
      </div>
    </div>
  );
}
