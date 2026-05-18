import { parseAiStreamPayload } from "./ai-schema";

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

  if (messageType === "artifact.refresh_required") {
    return {
      content: null,
      type: "refetch",
      shouldRefetch: true,
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

  if (obj.content_text) {
    return { content: obj.content_text, type: obj.message_type ?? messageType, operationId };
  }

  if (obj.content) {
    return { content: obj.content, type: obj.message_type ?? messageType, operationId };
  }

  return {
    content: null,
    type: operationId ? (messageType ?? "operation") : undefined,
    operationId,
  };
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
