import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

function createMessageId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: createMessageId(),
      content:
        "您好！AI 实时通道正在升级中（WebSocket 已移除，等待 SSE 接入）。您可以先记录调整指令草稿。",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }, [messages, isThinking]);

  const handleSendMessage = () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: createMessageId(),
      content: trimmed,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsThinking(true);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          content:
            "已记录该指令草稿。下一步接入 SSE 后，我会按实时流式结果返回分析与执行反馈。",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      setIsThinking(false);
    }, 400);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-all duration-300 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <Sparkles className="w-8 h-8" />
      </Button>

      {/* AI助手悬浮窗 */}
      <div
        className={`fixed bottom-6 right-6 w-96 h-[32rem] z-50 transition-all duration-300 ${
          isOpen 
            ? "scale-100 opacity-100 translate-y-0" 
            : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        }`}
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
              onClick={() => setIsOpen(false)}
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
                          "bg-primary text-primary-foreground": message.sender === "user",
                          "bg-muted text-muted-foreground": message.sender === "ai",
                        }
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
                onKeyPress={handleKeyPress}
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
    </>
  );
}
