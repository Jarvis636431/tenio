
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, Send, WifiOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai" | "system";
  timestamp: Date;
  status?: "pending" | "streaming" | "done" | "error";
  requiresApproval?: boolean;
  approvalPayload?: unknown;
  approvalResolved?: boolean;
  metadata?: Record<string, unknown>;
  approvalDetails?: {
    title?: string;
    toolName?: string;
    proposedArgs?: unknown;
  };
}

type ConnectionStatus = "idle" | "connecting" | "open" | "closed" | "error";

const AI_WS_URL = import.meta.env.VITE_SOCKET_URL ||"";
const DEBUG_TAG = "[ai-ws-debug]";
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

function createMessageId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function extractApprovalContent(payload: unknown) {
  const obj = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const aiMsg = typeof obj.ai_message === "object" && obj.ai_message !== null ? (obj.ai_message as Record<string, unknown>) : undefined;
  const rawTextCandidate = typeof aiMsg?.text === "string" ? aiMsg.text : typeof obj.text === "string" ? obj.text : undefined;
  const rawText = rawTextCandidate ?? "AI 建议执行以下修改，是否确认？";

  const [summaryText] = rawText.split(/PROPOSED_ARGS/i);

  const puc = typeof obj.pending_update_call === "object" && obj.pending_update_call !== null ? (obj.pending_update_call as Record<string, unknown>) : undefined;
  const toolName = typeof puc?.tool_name === "string" ? puc.tool_name : undefined;
  const proposedArgs = (puc && "args" in puc) ? (puc as { args?: unknown }).args ?? puc : obj.pending_update_call ?? null;

  return {
    text: summaryText.trim(),
    title: typeof obj.title === "string" ? obj.title : undefined,
    toolName,
    proposedArgs,
  };
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const welcomeId = createMessageId();
    return [
      {
        id: welcomeId,
        content:
          "您好！我是天友智管平台的 AI 助手，您可以告诉我如何调整施工进度，如“将钢筋绑扎任务延期 3 天”或“添加新的装修任务”。",
        sender: "ai",
        timestamp: new Date(),
        status: "done",
      },
    ];
  });
  const [inputMessage, setInputMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isAwaitingApprovalResponse, setIsAwaitingApprovalResponse] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const hasSentUserMessageRef = useRef(false);
  const { currentProject } = useProject();
  const { token } = useAuth();

  const projectId = currentProject?.id || "";

  const isConnected = connectionStatus === "open";

  const showApprovalBanner = useMemo(
    () => messages.some((msg) => msg.requiresApproval && !msg.approvalResolved),
    [messages]
  );

  useEffect(() => {
    if (!AI_WS_URL) {
      setConnectionStatus("error");
      setErrorHint("未配置 AI WebSocket 地址，请联系管理员");
      return;
    }
    if (!projectId || !token) {
      setConnectionStatus("error");
      setErrorHint("缺少项目或登录信息，无法连接 AI 服务");
      return;
    }

    let shouldReconnect = true;

    const clearReconnectTimer = () => {
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const buildUrl = () => {
      const url = new URL(AI_WS_URL, window.location.origin);
      url.searchParams.set("project_id", projectId);
      url.searchParams.set("token", token);
      return url.toString();
    };

    const connect = () => {
      if (!shouldReconnect) return;
      clearReconnectTimer();
      setConnectionStatus("connecting");
      console.debug(DEBUG_TAG, "attempting connection", {
        projectId,
        hasToken: Boolean(token),
        attempt: reconnectAttemptsRef.current + 1,
      });

      hasSentUserMessageRef.current = false;
      const ws = new WebSocket(buildUrl());
      socketRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        clearReconnectTimer();
        setConnectionStatus("open");
        setErrorHint(null);
        console.debug(DEBUG_TAG, "connection opened");

        const initPayload = {
          type: "init",
          project_id: projectId,
          token,
        };
        try {
          ws.send(JSON.stringify(initPayload));
          console.debug(DEBUG_TAG, "sent init payload", initPayload);
        } catch (err) {
          console.error("send init payload error", err);
        }
      };

      ws.onmessage = (event) => {
        console.debug(DEBUG_TAG, "raw message", event.data);
        try {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } catch (err) {
          console.error("AI message parse error", err);
        }
      };

      ws.onerror = (event) => {
        console.error("AI WebSocket error", event);
        setConnectionStatus("error");
        setErrorHint("AI 服务连接异常，请检查网络或稍后再试");
        console.debug(DEBUG_TAG, "socket error event", event);
      };

      ws.onclose = (event) => {
        console.debug(DEBUG_TAG, "connection closed", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        setIsThinking(false);

        if (!shouldReconnect) {
          setConnectionStatus("closed");
          setErrorHint(null);
          return;
        }

        hasSentUserMessageRef.current = false;
        setConnectionStatus("connecting");
        setErrorHint(null);

        const nextAttempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = nextAttempt;
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, nextAttempt - 1),
          MAX_RECONNECT_DELAY
        );

        console.debug(DEBUG_TAG, "scheduling reconnect", { nextAttempt, delay });
        clearReconnectTimer();
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      clearReconnectTimer();
      reconnectAttemptsRef.current = 0;
      const ws = socketRef.current;
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        console.debug(DEBUG_TAG, "cleanup: closing socket");
        ws.close();
      }
      socketRef.current = null;
      hasSentUserMessageRef.current = false;
    };
  }, [projectId, token]);

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }, [messages, isThinking]);

  useEffect(() => {
    const handler = () => {
      const ws = socketRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (!hasSentUserMessageRef.current) return;
      ws.send(JSON.stringify({ type: "ping" }));
    };
    const interval = setInterval(handler, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;
    if (!projectId || !token) {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          content: "无法发送消息，缺少项目或登录信息。",
          sender: "system",
          timestamp: new Date(),
          status: "error",
        },
      ]);
      return;
    }

    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          content: "发送失败：AI 服务未连接，请检查网络",
          sender: "system",
          timestamp: new Date(),
          status: "error",
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: createMessageId(),
      content: trimmed,
      sender: "user",
      timestamp: new Date(),
      status: "done",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsThinking(true);

    const payload = {
      type: "user",
      project_id: projectId,
      token,
      text: trimmed,
    };

    try {
      ws.send(JSON.stringify(payload));
      console.debug(DEBUG_TAG, "sent payload", payload);
      hasSentUserMessageRef.current = true;
    } catch (err) {
      console.error("send message error", err);
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          content: "发送失败：网络异常",
          sender: "system",
          timestamp: new Date(),
          status: "error",
        },
      ]);
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const appendAIMessage = (content: string) => {
    const aiMessage: Message = {
      id: createMessageId(),
      content,
      sender: "ai",
      timestamp: new Date(),
      status: "done",
    };
    setMessages((prev) => [...prev, aiMessage]);
  };

  const handleServerMessage = (data: unknown) => {
    const obj = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
    const type = typeof obj.type === "string" ? obj.type : undefined;

    switch (type) {
      case "chunk": {
        setIsThinking(true);
        break;
      }
      case "done": {
        setIsThinking(false);
        console.debug("[ai-refresh] received done", {
          isAwaitingApprovalResponse,
          hasSentUserMessage: hasSentUserMessageRef.current,
        });
        if (typeof obj.text === "string") {
          appendAIMessage(String(obj.text));
        }

        const wasAwaiting = isAwaitingApprovalResponse;
        if (wasAwaiting) {
          setIsAwaitingApprovalResponse(false);
        }
        const dispatched = window.dispatchEvent(
          new CustomEvent("plan:refresh-request", {
            detail: { source: "ai-done" },
          })
        );
        console.debug(
          "[ai-refresh] dispatched plan:refresh-request from done (unconditional)",
          { dispatched, wasAwaiting }
        );
        break;
      }
      case "approval": {
        console.debug("[ai-refresh] received approval", {
          awaitingBefore: isAwaitingApprovalResponse,
        });
        const parsed = extractApprovalContent(data);
        const approvalMessage: Message = {
          id: createMessageId(),
          content: parsed.text || "AI 建议执行以下修改，是否确认？",
          sender: "ai",
          timestamp: new Date(),
          status: "done",
          requiresApproval: true,
          approvalPayload: data,
          approvalDetails: {
            title: parsed.title,
            toolName: parsed.toolName,
            proposedArgs: parsed.proposedArgs ?? undefined,
          },
        };
        setMessages((prev) => [...prev, approvalMessage]);
        setIsAwaitingApprovalResponse(true);
        console.debug("[ai-refresh] awaiting approval set true");
        setIsThinking(false);
        break;
      }
      case "error": {
        const errorMsg = typeof obj.text === "string" ? obj.text : "AI 服务返回错误";
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            content: errorMsg,
            sender: "system",
            timestamp: new Date(),
            status: "error",
          },
        ]);
        setIsThinking(false);
        break;
      }
      case "info": {
        const infoText = typeof obj.text === "string" ? obj.text : "";
        if (infoText) {
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId(),
              content: infoText,
              sender: "system",
              timestamp: new Date(),
              status: "done",
            },
          ]);
        }
        break;
      }
      default: {
        if (typeof obj.text === "string") {
          appendAIMessage(String(obj.text));
          setIsThinking(false);
        }
      }
    }
  };

  const handleApproveChange = (messageId: string, payload: unknown) => {
    if (!projectId || !token) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status: "error",
                content: `${msg.content}\n\n（无法提交审批结果，缺少项目或登录信息）`,
              }
            : msg
        )
      );
      return;
    }

    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status: "error",
                content: `${msg.content}\n\n（发送审批结果失败，AI 服务未连接）`,
              }
            : msg
        )
      );
      return;
    }

    try {
      const body = {
        type: "hitl_decision",
        approved: true,
      };
      console.debug("[ai-refresh] sending approval decision", body);
      ws.send(JSON.stringify(body));
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, approvalResolved: true } : msg
        )
      );
      console.debug("[ai-refresh] approval resolved set true, waiting for done...");

      // 立即派发一次刷新事件，避免依赖服务端 done 时序
      const dispatched = window.dispatchEvent(
        new CustomEvent("plan:refresh-request", {
          detail: { source: "approval-click" },
        })
      );
      console.debug(
        "[ai-refresh] dispatched plan:refresh-request from approval click",
        { dispatched }
      );
    } catch (error) {
      console.error("approval send error", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status: "error",
                content: `${msg.content}\n\n（发送审批结果失败，网络异常）`,
              }
            : msg
        )
      );
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
            <div className="flex items-center gap-2">
              {connectionStatus === "error" && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  {errorHint || "连接异常"}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
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
                          "bg-muted text-muted-foreground":
                            message.sender === "ai",
                          "border border-destructive/60 text-destructive bg-destructive/10":
                            message.status === "error",
                          "bg-secondary text-secondary-foreground":
                            message.sender === "system" && message.status !== "error",
                        }
                      )}
                    >
                      <div className="space-y-2">
                        {message.approvalDetails ? (
                          <>
                            {message.approvalDetails.title && (
                              <div className="font-semibold text-foreground whitespace-normal">
                                {message.approvalDetails.title}
                              </div>
                            )}
                            <div className="text-sm whitespace-pre-line">
                              {message.content}
                            </div>
                            {message.approvalDetails.proposedArgs && (
                              <div className="rounded border border-border/60 bg-background/80 mt-2">
                                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/60">
                                  {message.approvalDetails.toolName
                                    ? `计划调用：${message.approvalDetails.toolName}`
                                    : "计划执行参数"}
                                </div>
                                <pre className="px-3 py-2 text-xs overflow-x-auto whitespace-pre-wrap">
                                  {JSON.stringify(
                                    message.approvalDetails.proposedArgs,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            )}
                          </>
                        ) : (
                          <div>{message.content}</div>
                        )}
                      </div>
                      {message.requiresApproval && !message.approvalResolved && (
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApproveChange(message.id, message.approvalPayload)
                            }
                          >
                            <Check className="w-4 h-4 mr-1" />
                            确认修改
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            请确认 AI 修改建议
                          </span>
                        </div>
                      )}
                      {message.approvalResolved && (
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          已确认，等待执行结果
                        </div>
                      )}
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

          {errorHint && (
            <div className="px-4 pb-2 text-xs text-destructive flex items-center gap-2">
              <WifiOff className="w-3 h-3" />
              {errorHint}
            </div>
          )}

          {showApprovalBanner && !isAwaitingApprovalResponse && (
            <div className="px-4 pb-2 text-xs text-muted-foreground">
              请确认 AI 的修改建议以继续后续操作。
            </div>
          )}

          <CardFooter className="border-t px-4 py-3 flex flex-col gap-2">
            <div className="flex space-x-2 w-full">
              <Input
                placeholder="输入调整指令，如：'将钢筋绑扎延期3天'"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={!isConnected}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={!inputMessage.trim() || !isConnected}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {connectionStatus === "error" && (
              <span className="text-[11px] text-muted-foreground">
                AI 服务连接不可用，无法发送消息。
              </span>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
