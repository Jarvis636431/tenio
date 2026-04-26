import { API_BASE } from "@/config";
import { requestSse, type SseRequestOptions } from "@/services/http";
import {
  agentChatPayloadSchema,
  agentResumePayloadSchema,
  parseAiStreamPayload,
  parseAiVerifyPayload,
} from "./ai-schema";
import type { AgentResumePayload, AgentChatPayload } from "@/features/ai";

const AI_BASE_URL = API_BASE.aiService;

/**
 * 发送聊天消息并获取 SSE 流式响应
 * @returns 返回 Response 对象，可用于中断请求
 */
export async function chatWithAgentStream(
  payload: AgentChatPayload,
  handlers: Pick<SseRequestOptions, "onMessage" | "onDone" | "onError"> & {
    signal?: AbortSignal;
  },
): Promise<Response> {
  const parsedPayload = agentChatPayloadSchema.parse(payload);
  return requestSse(`${AI_BASE_URL}/api/agent/chat/sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parsedPayload),
    signal: handlers.signal,
    onMessage: handlers.onMessage,
    onDone: handlers.onDone,
    onError: handlers.onError,
  });
}

/**
 * 恢复中断的对话并获取 SSE 流式响应
 * @returns 返回 Response 对象，可用于中断请求
 */
export async function resumeAgentStream(
  payload: AgentResumePayload,
  handlers: Pick<SseRequestOptions, "onMessage" | "onDone" | "onError"> & {
    signal?: AbortSignal;
  },
): Promise<Response> {
  const parsedPayload = agentResumePayloadSchema.parse(payload);
  return requestSse(`${AI_BASE_URL}/api/agent/chat/resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parsedPayload),
    signal: handlers.signal,
    onMessage: handlers.onMessage,
    onDone: handlers.onDone,
    onError: handlers.onError,
  });
}

/**
 * 提取 SSE 消息中的有效内容
 * 处理多种消息类型：update、verify、interrupt、refetch 等
 */
export function extractChatMessageContent(payload: unknown): {
  content: string | null;
  type?: string;
  shouldRefetch?: boolean;
} {
  const parsed = parseAiStreamPayload(payload);
  if (!parsed.success) {
    return { content: null };
  }

  const obj = parsed.data;
  const messageType = obj.type;

  // refetch 类型：触发数据刷新
  if (messageType === "refetch") {
    return { content: null, type: "refetch", shouldRefetch: true };
  }

  // verify 类型：验证消息
  if (messageType === "verify") {
    return {
      content: buildVerifyMessage(obj.data),
      type: "verify",
    };
  }

  // update 类型：普通更新
  if (messageType === "update") {
    return {
      content: extractUpdateContent(obj),
      type: "update",
    };
  }

  // interrupt 类型：中断消息
  if (messageType === "interrupt") {
    return {
      content: (obj.message as string) ?? (obj.data as string) ?? null,
      type: "interrupt",
    };
  }

  // 尝试从路由字段提取
  const routedContent =
    extractFromRoute(obj, "knowledge_query") ??
    extractFromRoute(obj, "project_info_query") ??
    extractFromRoute(obj, "conversation");

  if (routedContent) {
    return { content: routedContent, type: "routed" };
  }

  // 尝试提取 __interrupt__
  const interruptContent = extractInterrupt(obj);
  if (interruptContent) {
    return { content: interruptContent, type: "interrupt" };
  }

  return { content: null };
}

/**
 * 构建验证消息
 */
function buildVerifyMessage(data: unknown): string | null {
  const parsed = parseAiVerifyPayload(data);
  if (!parsed.success) {
    return null;
  }

  const payload = parsed.data;
  const verifyType = payload.verify_type ?? "unknown";
  const lines: string[] = [];

  switch (verifyType) {
    case "adjust_project":
      lines.push("类型：项目工期调整验证");
      if (typeof payload.target_date === "string") lines.push(`目标日期：${payload.target_date}`);
      if (typeof payload.finish_date === "string") lines.push(`完成日期：${payload.finish_date}`);
      break;

    case "adjust_task":
      lines.push("类型：任务工期调整验证");
      if (typeof payload.task_name === "string") lines.push(`任务名称：${payload.task_name}`);
      if (typeof payload.finish_date === "string") lines.push(`完成日期：${payload.finish_date}`);
      break;

    case "unexpected_event":
      lines.push("类型：突发事件验证");
      if (payload.intent) lines.push(`意图：${payload.intent}`);
      if (payload.affected_task_ids) {
        lines.push(`受影响任务：${JSON.stringify(payload.affected_task_ids)}`);
      }
      break;

    default:
      lines.push(`类型：${verifyType}`);
      lines.push(`数据：${JSON.stringify(payload)}`);
  }

  return lines.join("\n") || null;
}

/**
 * 从 update 类型消息中提取内容
 */
function extractUpdateContent(obj: Record<string, unknown>): string | null {
  const parsed = parseAiStreamPayload(obj);
  if (!parsed.success) {
    return null;
  }

  if (parsed.data.message) return parsed.data.message;
  if (typeof parsed.data.data === "string") return parsed.data.data;

  const nested = parseAiStreamPayload(parsed.data.data);
  if (!nested.success) {
    return null;
  }

  const routeObj = nested.data.project_info_query ?? nested.data.knowledge_query;
  const messages = routeObj?.messages ?? [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.type === "tool" || msg?.type === "system") continue;
    if (msg?.content) return msg.content;
  }

  return null;
}

/**
 * 从路由字段提取消息内容
 */
function extractFromRoute(obj: Record<string, unknown>, routeKey: string): string | null {
  const parsed = parseAiStreamPayload(obj);
  if (!parsed.success) {
    return null;
  }
  const routeObj =
    routeKey === "knowledge_query"
      ? parsed.data.knowledge_query
      : routeKey === "project_info_query"
        ? parsed.data.project_info_query
        : parsed.data.conversation;
  if (!routeObj?.messages) return null;

  const messages = routeObj.messages;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.type === "tool") continue;
    if (msg?.content) return msg.content;
  }
  return null;
}

/**
 * 提取中断消息内容
 */
function extractInterrupt(obj: Record<string, unknown>): string | null {
  const parsed = parseAiStreamPayload(obj);
  if (!parsed.success) {
    return null;
  }
  const interrupts = parsed.data.__interrupt__;
  if (!Array.isArray(interrupts) || interrupts.length === 0) return null;

  const last: unknown = interrupts[interrupts.length - 1];

  if (typeof last === "string") {
    const match = last.match(/Interrupt\(value='([\s\S]*?)', id='.*?'\)/);
    if (match?.[1]) {
      return match[1].replace(/\\n/g, "\n");
    }
    return last.replace(/\\n/g, "\n");
  }

  if (typeof last === "object" && last !== null) {
    const value = (last as { value?: string }).value;
    if (value) {
      return value.replace(/\\n/g, "\n");
    }
  }

  return null;
}
