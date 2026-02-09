import { Loader2, Mic, Send, Sparkles, Square, X } from "lucide-react";
import { useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ChatPanelState } from "@/components/ai/hooks/useChatPanel";

interface ChatPanelProps {
  state: ChatPanelState;
  position?: Pick<CSSProperties, "top" | "right" | "bottom" | "left">;
  positionType?: "fixed" | "absolute";
  height?: number | string;
  width?: number | string;
}

export function ChatPanel({
  state,
  position,
  positionType = "fixed",
  height,
  width,
}: ChatPanelProps) {
  const {
    isOpen,
    close,
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
  const [interruptDecisions, setInterruptDecisions] = useState<
    Record<string, "yes" | "no">
  >({});

  const renderInterruptMessage = (content: string, messageId: string) => {
    const normalized = content.replace(/\\n/g, "\n").replace(/\/n/g, "\n");
    const lines = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const header = lines[0] ?? "突发事件提示";
    const detailLines = lines.slice(1);

    const tasks: Array<{
      name: string;
      id?: string;
      start?: string;
      end?: string;
    }> = [];

    let currentTask: (typeof tasks)[number] | null = null;
    for (const line of detailLines) {
      if (line.startsWith("- ")) {
        const raw = line.replace(/^-\\s*/, "");
        const idMatch = raw.match(/\\(ID=([^\\)]+)\\)/);
        currentTask = {
          name: raw.replace(/\\s*\\(ID=.*\\)$/, "").trim(),
          id: idMatch?.[1],
        };
        tasks.push(currentTask);
        continue;
      }
      if (currentTask && line.startsWith("开始:")) {
        currentTask.start = line.replace(/^开始:\\s*/, "").trim();
        continue;
      }
      if (currentTask && line.startsWith("结束:")) {
        currentTask.end = line.replace(/^结束:\\s*/, "").trim();
        continue;
      }
    }

    const renderLine = (line: string) => (
      <div key={line} className="text-xs text-slate-700">
        {line}
      </div>
    );

    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold text-amber-900">{header}</div>
        <div className="space-y-1">
          {detailLines
            .filter(
              (line) =>
                !line.startsWith("- ") &&
                !line.startsWith("开始:") &&
                !line.startsWith("结束:") &&
                !line.startsWith("建议方案：") &&
                !line.startsWith("请确认是否执行此调整") &&
                !line.startsWith("受影响的任务") &&
                !line.startsWith("受影响任务"),
            )
            .map(renderLine)}
        </div>
        {tasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">
              受影响任务
            </div>
            {tasks.map((task) => (
              <div
                key={`${task.name}-${task.id ?? ""}`}
                className="rounded-md border border-amber-200 bg-amber-50/70 px-2 py-2 text-xs text-slate-700"
              >
                <div className="font-medium text-slate-900">{task.name}</div>
                {task.id && (
                  <div className="text-[11px] text-slate-500">
                    ID: {task.id}
                  </div>
                )}
                {task.start && <div>开始: {task.start}</div>}
                {task.end && <div>结束: {task.end}</div>}
              </div>
            ))}
          </div>
        )}
        <div className="text-xs text-slate-700">
          {detailLines.find((line) => line.startsWith("建议方案：")) ?? ""}
        </div>
        <div className="rounded-md bg-amber-100 px-2 py-2 text-xs font-medium text-amber-900">
          {detailLines.find((line) => line.startsWith("请确认是否执行此调整？")) ??
            "请确认是否执行此调整？"}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-8 rounded-md bg-amber-600 text-white hover:bg-amber-700"
            onClick={() => {
              setInterruptDecisions((prev) => ({
                ...prev,
                [messageId]: "yes",
              }));
              resumeInterrupt("是", true);
            }}
            disabled={isThinking || interruptDecisions[messageId] !== undefined}
          >
            {interruptDecisions[messageId] === "yes" ? "已选：是" : "是"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-md border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => {
              setInterruptDecisions((prev) => ({
                ...prev,
                [messageId]: "no",
              }));
              resumeInterrupt("否", false);
            }}
            disabled={isThinking || interruptDecisions[messageId] !== undefined}
          >
            {interruptDecisions[messageId] === "no" ? "已选：否" : "否"}
          </Button>
        </div>
      </div>
    );
  };

  const renderMessageContent = (message: ChatPanelState["messages"][number]) => {
    const content = message.content ?? "";
    const isInterrupt =
      message.sender === "ai" &&
      (content.includes("突发事件分析完成") ||
        content.includes("请确认是否执行此调整"));
    if (isInterrupt) {
      return renderInterruptMessage(content, message.id);
    }
    const normalized = content.replace(/\\n/g, "\n").replace(/\/n/g, "\n");
    return <div>{normalized}</div>;
  };

  return (
    <div
      className={cn(
        "z-50 transition-all duration-300",
        positionType === "fixed" ? "fixed" : "absolute",
        isOpen
          ? "scale-100 opacity-100 translate-y-0"
          : "scale-95 opacity-0 translate-y-4 pointer-events-none",
      )}
      style={{
        width: width ?? "24rem",
        height: height ?? "32rem",
        ...(position ?? { bottom: 24, right: 24 }),
      }}
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
              {messages.map((message) => {
                const isEmpty =
                  message.sender === "ai" &&
                  (!message.content || message.content.trim().length === 0);
                if (isEmpty) return null;
                return (
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
                      {renderMessageContent(message)}
                    </div>
                  </div>
                );
              })}
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
              aria-label="输入调整指令"
              className="flex-1"
            />
            <Button
              onClick={toggleRecording}
              size="icon"
              variant={isRecording ? "default" : "outline"}
              disabled={isRecognizing && !isRecording}
              aria-label={isRecording ? "结束录音" : "开始录音"}
              className={cn(
                "relative transition-all",
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-500 ring-2 ring-red-400/60 animate-pulse"
                  : "",
              )}
              style={isRecording ? { animationDuration: "1.6s" } : undefined}
            >
              {isRecording ? (
                <Square className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={handleSendMessage}
              size="icon"
              disabled={!inputMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {isRecognizing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              正在识别语音，识别结果会填入输入框
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
