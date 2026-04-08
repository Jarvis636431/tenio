import { BarChart3, Boxes, CloudSun, Loader2, ShieldAlert, Users, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { ChatState } from "../";
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
  const [mode, setMode] = useState<"query" | "schedule">("query");
  const quickQueries = [
    { label: "当前施工进度如何？", icon: BarChart3 },
    { label: "今日在场人数？", icon: Users },
    { label: "今天天气情况", icon: CloudSun },
    { label: "本周安全隐患", icon: ShieldAlert },
    { label: "材料库存状态", icon: Boxes },
    { label: "关键路径节点", icon: Zap },
  ];

  return (
    <div
      className={cn(
        "h-full min-h-0 w-full overflow-hidden border-r border-cyan-900/40 bg-gradient-to-b from-[#020a1d] to-[#041332] backdrop-blur-sm",
        className,
      )}
    >
      <Card className="flex h-full min-h-0 flex-col border-0 bg-transparent shadow-none">
        <ChatHeader mode={mode} onModeChange={setMode} />

        <CardContent className="min-h-0 flex-1 overflow-hidden px-0">
          <div className="h-full min-h-0 overflow-y-auto px-4" ref={scrollAreaRef}>
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
        </CardContent>

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
      </Card>
    </div>
  );
}
