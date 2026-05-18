import { z } from "zod";

const streamMessageSchema = z.object({
  type: z.string().optional(),
  content: z.string().optional(),
  content_text: z.string().optional(),
});

const streamRouteSchema = z.object({
  messages: z.array(streamMessageSchema).optional(),
});

const verifyPayloadSchema = z
  .object({
    verify_type: z.string().optional(),
    target_date: z.string().optional(),
    finish_date: z.string().optional(),
    task_name: z.string().optional(),
    intent: z.string().optional(),
    affected_task_ids: z.array(z.string()).optional(),
  })
  .catchall(z.unknown());

export const aiStreamPayloadSchema = z
  .object({
    type: z.string().optional(),
    message: z.string().optional(),
    content: z.string().optional(),
    content_text: z.string().optional(),
    data: z.unknown().optional(),
    operation_id: z.string().optional(),
    operationId: z.string().optional(),
    artifact_types: z.array(z.string()).optional(),
    message_role: z.string().optional(),
    message_type: z.string().optional(),
    knowledge_query: streamRouteSchema.optional(),
    project_info_query: streamRouteSchema.optional(),
    conversation: streamRouteSchema.optional(),
    __interrupt__: z
      .array(z.union([z.string(), z.object({ value: z.string().optional() })]))
      .optional(),
  })
  .catchall(z.unknown());

export function parseAiStreamPayload(payload: unknown) {
  return aiStreamPayloadSchema.safeParse(payload);
}

export function parseAiVerifyPayload(payload: unknown) {
  return verifyPayloadSchema.safeParse(payload);
}
