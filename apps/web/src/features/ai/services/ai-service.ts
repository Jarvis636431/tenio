import { parseAiStreamPayload, parseAiVerifyPayload } from "./ai-schema";

/**
 * 提取 SSE 消息中的有效内容与运行时事件。
 */
export function extractChatMessageContent(payload: unknown): {
  content: string | null;
  type?: string;
  shouldRefetch?: boolean;
  shouldPollOperation?: boolean;
  operationId?: string;
} {
  const parsed = parseAiStreamPayload(payload);
  if (!parsed.success) {
    return { content: null };
  }

  const obj = parsed.data;
  const messageType = obj.type;
  const operationId = extractOperationId(obj);

  const interruptContent = extractInterruptContent(obj);
  if (interruptContent !== null) {
    return { content: interruptContent, type: "interrupt", operationId };
  }

  if (messageType === "refetch" || messageType === "artifact.refresh_required") {
    return {
      content: null,
      type: "refetch",
      shouldRefetch: true,
      operationId,
    };
  }

  if (messageType === "verify") {
    return {
      content: buildVerifyMessage(obj.data),
      type: "verify",
      operationId,
    };
  }

  if (messageType === "operation.completed") {
    return {
      content: null,
      type: "operation.completed",
      shouldPollOperation: true,
      operationId,
    };
  }

  if (messageType === "operation.requires_approval") {
    return {
      content: "请确认是否执行这次操作。",
      type: "interrupt",
      operationId,
    };
  }

  if (messageType === "operation.canceled") {
    return {
      content: "该操作已取消。",
      type: "interrupt",
      operationId,
    };
  }

  const messageContent = extractString(obj.message);
  if (messageContent) {
    return { content: messageContent, type: messageType, operationId };
  }

  if (obj.content) {
    return { content: obj.content, type: messageType, operationId };
  }

  const dataContent = extractString(obj.data);
  if (dataContent) {
    return { content: dataContent, type: messageType, operationId };
  }

  const nestedContent = extractRoutedContent(obj);
  if (nestedContent) {
    return {
      content: nestedContent,
      type: messageType ?? "routed",
      operationId,
    };
  }

  return {
    content: null,
    type: messageType ?? (operationId ? "operation" : undefined),
    operationId,
  };
}

function extractString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function buildVerifyMessage(data: unknown): string | null {
  const parsed = parseAiVerifyPayload(data);
  if (!parsed.success) return null;

  const verifyType = parsed.data.verify_type;
  if (!verifyType) return null;

  switch (verifyType) {
    case "adjust_project":
      return [
        "项目工期调整验证",
        parsed.data.target_date ? `目标日期：${parsed.data.target_date}` : null,
        parsed.data.finish_date ? `当前完成日期：${parsed.data.finish_date}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    case "adjust_task":
      return [
        "任务工期调整验证",
        parsed.data.task_name ? `任务：${parsed.data.task_name}` : null,
        parsed.data.finish_date ? `完成日期：${parsed.data.finish_date}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    case "unexpected_event":
      return [
        "突发事件验证",
        parsed.data.intent ? `调整意图：${parsed.data.intent}` : null,
        parsed.data.affected_task_ids?.length
          ? `影响任务：${parsed.data.affected_task_ids.join("、")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");
    default:
      return `操作验证：${verifyType}`;
  }
}

function extractRoutedContent(obj: Record<string, unknown>): string | null {
  const routeNames = ["knowledge_query", "project_info_query", "conversation"] as const;

  for (const routeName of routeNames) {
    const routeContent = extractRouteContent(obj[routeName]);
    if (routeContent) return routeContent;
  }

  return extractRouteContent(obj.data);
}

function extractRouteContent(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  for (const routeName of ["knowledge_query", "project_info_query", "conversation"]) {
    const nested = extractRouteContent(record[routeName]);
    if (nested) return nested;
  }

  const messages: unknown[] = Array.isArray(record.messages) ? record.messages : [];
  if (messages.length === 0) return null;

  const message = [...messages].reverse().find((item): item is Record<string, unknown> => {
    if (!item || typeof item !== "object") return false;
    const type = (item as Record<string, unknown>).type;
    return type !== "tool" && type !== "system";
  });

  if (!message) return null;
  return extractString(message.content);
}

function extractInterruptContent(obj: Record<string, unknown>): string | null {
  if (obj.type === "interrupt") {
    return extractString(obj.message) ?? extractString(obj.data);
  }

  if (!Array.isArray(obj.__interrupt__)) return null;

  for (const item of obj.__interrupt__) {
    if (typeof item === "string") {
      const match = /value='([\s\S]*?)',\s*id=/.exec(item);
      if (match?.[1]) return match[1].replace(/\\n/g, "\n");
    }

    if (item && typeof item === "object") {
      const value = (item as Record<string, unknown>).value;
      if (typeof value === "string") return value;
    }
  }

  return null;
}

function extractOperationId(obj: Record<string, unknown>): string | undefined {
  if (typeof obj.operation_id === "string") return obj.operation_id;
  if (typeof obj.operationId === "string") return obj.operationId;

  const data = obj.data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.operation_id === "string") return record.operation_id;
    if (typeof record.operationId === "string") return record.operationId;
  }

  return undefined;
}
