import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDateString } from "@/lib/date";

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

interface Message {
  id: string;
  content?: string;
  sender: "user" | "ai";
}

interface ChatMessageProps {
  message: Message;
  isThinking: boolean;
  interruptDecision?: "yes" | "no";
  onInterruptDecision: (messageId: string, decision: "yes" | "no") => void;
  onResumeInterrupt: (response: string, confirmed: boolean) => void;
}

function renderUnexpectedEvent(payload: UnexpectedEventPayload) {
  const tasks = payload.affected_tasks ?? [];
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-amber-200">突发事件</div>
      {payload.intent && <div className="text-xs text-cyan-100/80">{payload.intent}</div>}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-cyan-100/75">受影响任务</div>
          {tasks.map((task, index) => (
            <div
              key={`${task.name ?? "task"}-${index}`}
              className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-xs text-cyan-100/80"
            >
              <div className="font-medium text-cyan-50">{task.name || "未命名任务"}</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div className="text-cyan-300/70">开始</div>
                <div>
                  {formatDateString(task.raw_startdate)} →{" "}
                  {formatDateString(task.current_startdate)}
                </div>
                <div className="text-cyan-300/70">结束</div>
                <div>
                  {formatDateString(task.raw_enddate)} → {formatDateString(task.current_enddate)}
                </div>
                {(task.raw_duration !== undefined || task.current_duration !== undefined) && (
                  <>
                    <div className="text-cyan-300/70">工期(h)</div>
                    <div>
                      {task.raw_duration ?? "-"} → {task.current_duration ?? "-"}
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
}

function renderInterruptMessage(
  content: string,
  messageId: string,
  isThinking: boolean,
  interruptDecision: "yes" | "no" | undefined,
  onInterruptDecision: (messageId: string, decision: "yes" | "no") => void,
  onResumeInterrupt: (response: string, confirmed: boolean) => void,
) {
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
      const raw = line.replace(/^-\s*/, "");
      const idMatch = raw.match(/\\(ID=([^\\)]+)\\)/);
      currentTask = {
        name: raw.replace(/\s*\(ID=.*\)$/, "").trim(),
        id: idMatch?.[1],
      };
      tasks.push(currentTask);
      continue;
    }
    if (currentTask && (line.startsWith("开始:") || line.startsWith("开始："))) {
      currentTask.start = line.replace(/^开始[:：]\s*/, "").trim();
      continue;
    }
    if (currentTask && (line.startsWith("结束:") || line.startsWith("结束："))) {
      currentTask.end = line.replace(/^结束[:：]\s*/, "").trim();
      continue;
    }
  }

  const renderLine = (line: string) => (
    <div key={line} className="text-xs text-cyan-100/80">
      {line}
    </div>
  );
  const normalizeTimeLabel = (value?: string) =>
    value ? value.replace(/^开始[:：]\s*/, "").replace(/^结束[:：]\s*/, "") : value;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-amber-200">{header}</div>
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
          <div className="text-xs font-semibold text-cyan-100/75">受影响任务</div>
          {tasks.map((task) => (
            <div
              key={`${task.name}-${task.id ?? ""}`}
              className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-xs text-cyan-100/80"
            >
              <div className="font-medium text-cyan-50">{task.name}</div>
              {task.id && <div className="text-[11px] text-cyan-300/70">ID: {task.id}</div>}
              {task.start && <div>开始: {normalizeTimeLabel(task.start)}</div>}
              {task.end && <div>结束: {normalizeTimeLabel(task.end)}</div>}
            </div>
          ))}
        </div>
      )}
      <div className="text-xs text-cyan-100/80">
        {detailLines.find((line) => line.startsWith("建议方案：")) ?? ""}
      </div>
      <div className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-2 text-xs font-medium text-amber-100">
        {detailLines.find((line) => line.startsWith("请确认是否执行此调整？")) ??
          "请确认是否执行此调整？"}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-8 rounded-md bg-amber-500/85 text-slate-950 hover:bg-amber-400"
          onClick={() => {
            onInterruptDecision(messageId, "yes");
            void onResumeInterrupt("是", true);
          }}
          disabled={isThinking || interruptDecision !== undefined}
        >
          {interruptDecision === "yes" ? "已选：是" : "是"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-md border-amber-500/40 bg-transparent text-amber-100 hover:bg-amber-500/10"
          onClick={() => {
            onInterruptDecision(messageId, "no");
            void onResumeInterrupt("否", false);
          }}
          disabled={isThinking || interruptDecision !== undefined}
        >
          {interruptDecision === "no" ? "已选：否" : "否"}
        </Button>
      </div>
    </div>
  );
}

function renderMessageContent(
  message: Message,
  isThinking: boolean,
  interruptDecision: "yes" | "no" | undefined,
  onInterruptDecision: (messageId: string, decision: "yes" | "no") => void,
  onResumeInterrupt: (response: string, confirmed: boolean) => void,
) {
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
    (content.includes("突发事件分析完成") || content.includes("请确认是否执行此调整"));
  if (isInterrupt) {
    return renderInterruptMessage(
      content,
      message.id,
      isThinking,
      interruptDecision,
      onInterruptDecision,
      onResumeInterrupt,
    );
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
          <blockquote className="border-l-2 border-cyan-500/40 pl-3 text-cyan-100/70">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
            target="_blank"
            rel="noreferrer"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-cyan-950/70 px-1 py-0.5 text-[12px] text-cyan-100">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="overflow-x-auto rounded-lg border border-cyan-900/50 bg-[#020d22] p-2 text-[12px] text-cyan-100">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <table className="w-full border-collapse text-xs text-cyan-100/85">{children}</table>
        ),
        th: ({ children }) => (
          <th className="border border-cyan-900/50 bg-cyan-950/60 px-2 py-1 text-left text-cyan-100">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-cyan-900/40 px-2 py-1 text-cyan-100/80">{children}</td>
        ),
      }}
    >
      {normalized}
    </ReactMarkdown>
  );
}

export function ChatMessage({
  message,
  isThinking,
  interruptDecision,
  onInterruptDecision,
  onResumeInterrupt,
}: ChatMessageProps) {
  const isEmpty =
    message.sender === "ai" && (!message.content || message.content.trim().length === 0);
  if (isEmpty) return null;

  return (
    <div
      className={cn("flex", {
        "justify-end": message.sender === "user",
        "justify-start": message.sender !== "user",
      })}
    >
      <div
        className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-line break-words", {
          "bg-cyan-600/90 text-white": message.sender === "user",
          "bg-[#03112a] text-cyan-100 border border-cyan-900/40": message.sender === "ai",
        })}
      >
        {renderMessageContent(
          message,
          isThinking,
          interruptDecision,
          onInterruptDecision,
          onResumeInterrupt,
        )}
      </div>
    </div>
  );
}
