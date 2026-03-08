import {
  BarChart3,
  Boxes,
  CloudSun,
  Loader2,
  Mic,
  Paperclip,
  Send,
  ShieldAlert,
  Sparkles,
  Square,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ChatPanelState } from "@/components/ai/hooks/useChatPanel";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const UNEXPECTED_EVENT_PREFIX = "__unexpected_event__:";

type UnexpectedEventPayload = {
  intent?: string;
  affected_tasks?: Array<{
    name?: string;
    raw_startdate?: string;
    current_startdate?: string;
    raw_enddate?: string;
    current_enddate?: string;
    raw_duration?: number;
    current_duration?: number;
  }>;
};

function formatDateString(value?: string) {
  if (!value) return "-";
  if (value.length >= 10) {
    const datePart = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }
  return value;
}

interface ChatProps {
  state: ChatPanelState;
  className?: string;
}

export function Chat({
  state,
  className,
}: ChatProps) {
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
  const [interruptDecisions, setInterruptDecisions] = useState<
    Record<string, "yes" | "no">
  >({});
  const quickQueries = [
    { label: "当前施工进度如何？", icon: BarChart3 },
    { label: "今日在场人数？", icon: Users },
    { label: "今天天气情况", icon: CloudSun },
    { label: "本周安全隐患", icon: ShieldAlert },
    { label: "材料库存状态", icon: Boxes },
    { label: "关键路径节点", icon: Zap },
  ];

  const renderUnexpectedEvent = (payload: UnexpectedEventPayload) => {
    const tasks = payload.affected_tasks ?? [];
    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold text-amber-900">突发事件</div>
        {payload.intent && (
          <div className="text-xs text-slate-700">{payload.intent}</div>
        )}
        {tasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">
              受影响任务
            </div>
            {tasks.map((task, index) => (
              <div
                key={`${task.name ?? "task"}-${index}`}
                className="rounded-md border border-amber-200 bg-amber-50/70 px-2 py-2 text-xs text-slate-700"
              >
                <div className="font-medium text-slate-900">
                  {task.name || "未命名任务"}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div className="text-slate-500">开始</div>
                  <div>
                    {formatDateString(task.raw_startdate)} →{" "}
                    {formatDateString(task.current_startdate)}
                  </div>
                  <div className="text-slate-500">结束</div>
                  <div>
                    {formatDateString(task.raw_enddate)} →{" "}
                    {formatDateString(task.current_enddate)}
                  </div>
                  {(task.raw_duration !== undefined ||
                    task.current_duration !== undefined) && (
                    <>
                      <div className="text-slate-500">工期(h)</div>
                      <div>
                        {task.raw_duration ?? "-"} →{" "}
                        {task.current_duration ?? "-"}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
      if (currentTask && (line.startsWith("开始:") || line.startsWith("开始："))) {
        currentTask.start = line.replace(/^开始[:：]\\s*/, "").trim();
        continue;
      }
      if (currentTask && (line.startsWith("结束:") || line.startsWith("结束："))) {
        currentTask.end = line.replace(/^结束[:：]\\s*/, "").trim();
        continue;
      }
    }

    const renderLine = (line: string) => (
      <div key={line} className="text-xs text-slate-700">
        {line}
      </div>
    );
    const normalizeTimeLabel = (value?: string) =>
      value ? value.replace(/^开始[:：]\s*/, "").replace(/^结束[:：]\s*/, "") : value;

    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold text-amber-900">{header}</div>
        <div className="space-y-1">
          {detailLines
            .filter(
              (line) =>
                !line.startsWith("- ") &&
                !line.startsWith("开始:") &&
                !line.startsWith("开始：") &&
                !line.startsWith("结束:") &&
                !line.startsWith("结束：") &&
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
                {task.start && <div>开始: {normalizeTimeLabel(task.start)}</div>}
                {task.end && <div>结束: {normalizeTimeLabel(task.end)}</div>}
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
    if (content.startsWith(UNEXPECTED_EVENT_PREFIX)) {
      const raw = content.slice(UNEXPECTED_EVENT_PREFIX.length);
      try {
        const payload = JSON.parse(raw) as UnexpectedEventPayload;
        return renderUnexpectedEvent(payload);
      } catch {
        // fall through to default render
      }
    }
    const isInterrupt =
      message.sender === "ai" &&
      (content.includes("突发事件分析完成") ||
        content.includes("请确认是否执行此调整"));
    if (isInterrupt) {
      return renderInterruptMessage(content, message.id);
    }
    const normalized = content.replace(/\\n/g, "\n").replace(/\/n/g, "\n");
    if (message.sender !== "ai") {
      return <div>{normalized}</div>;
    }
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="break-words"
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-slate-300 pl-3 text-slate-600">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-blue-600 underline" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded bg-slate-100 p-2 text-[12px]">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <table className="w-full border-collapse text-xs">{children}</table>
          ),
          th: ({ children }) => (
            <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-200 px-2 py-1">{children}</td>
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    );
  };

  return (
    <div className={cn("h-full w-full border-r border-cyan-900/40 bg-gradient-to-b from-[#020a1d] to-[#041332] backdrop-blur-sm", className)}>
      <Card className="h-full border-0 bg-transparent shadow-none flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-cyan-100">
            <Sparkles className="w-5 h-5 text-cyan-300" />
            AI助手
          </CardTitle>
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
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-line break-words",
                        {
                          "bg-cyan-600/90 text-white":
                            message.sender === "user",
                          "bg-[#03112a] text-cyan-100 border border-cyan-900/40":
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
                <div className="flex items-center gap-2 text-xs text-cyan-300/70">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  AI 正在思考中...
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 py-3">
          <div className="mb-3 w-full">
            <div className="mb-2 text-sm font-semibold text-cyan-200">常用查询</div>
            <div className="grid grid-cols-2 gap-2">
              {quickQueries.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.label}
                    type="button"
                    variant="ghost"
                    onClick={() => sendQuickMessage(item.label)}
                    className="h-9 justify-start gap-2 rounded-full border border-cyan-900/60 bg-[#03112a] px-3 text-cyan-200 hover:bg-[#0a2a5c]"
                  >
                    <Icon className="h-3.5 w-3.5 text-cyan-300" />
                    <span className="truncate text-xs">{item.label}</span>
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
                  onClick={toggleRecording}
                  size="icon"
                  variant="ghost"
                  disabled={isRecognizing && !isRecording}
                  aria-label={isRecording ? "结束录音" : "开始录音"}
                  className={cn(
                    "h-9 w-9 rounded-xl border border-cyan-900/70 bg-[#051a3d] text-slate-200 hover:bg-[#0a2a5c]",
                    isRecording
                      ? "border-red-400/70 bg-red-900/30 text-red-100 animate-pulse"
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
              </div>
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={!inputMessage.trim()}
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
        </CardFooter>
      </Card>
    </div>
  );
}
