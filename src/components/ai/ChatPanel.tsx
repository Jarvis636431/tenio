import { Loader2, Send, Sparkles, X } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ChatPanelState } from "@/components/ai/hooks/useChatPanel";

interface ChatPanelProps {
  state: ChatPanelState;
  position?: Pick<CSSProperties, "top" | "right" | "bottom" | "left">;
}

export function ChatPanel({ state, position }: ChatPanelProps) {
  const {
    isOpen,
    close,
    messages,
    inputMessage,
    setInputMessage,
    isThinking,
    handleSendMessage,
    handleInputEnter,
    scrollAreaRef,
  } = state;

  return (
    <div
      className={`fixed w-96 h-[32rem] z-50 transition-all duration-300 ${
        isOpen
          ? "scale-100 opacity-100 translate-y-0"
          : "scale-95 opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={position ?? { bottom: 24, right: 24 }}
    >
      <Card className="h-full shadow-2xl border-2 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-category-blue-600" />
            AI助手
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="px-0 flex-1 overflow-hidden min-h-0">
          <div className="h-full px-4 overflow-y-auto" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", {
                    "justify-end": message.sender === "user",
                    "justify-start": message.sender !== "user",
                  })}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-line",
                      {
                        "bg-primary text-primary-foreground":
                          message.sender === "user",
                        "bg-muted text-muted-foreground":
                          message.sender === "ai",
                      },
                    )}
                  >
                    <div>{message.content}</div>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  AI 正在思考中...
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t px-4 py-3 flex flex-col gap-2">
          <div className="flex space-x-2 w-full">
            <Input
              placeholder="输入调整指令，如：'将钢筋绑扎延期3天'"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleInputEnter}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              disabled={!inputMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-[11px] text-muted-foreground">
            当前实时通道未接入（WebSocket 已移除），正在切换为 SSE。
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
