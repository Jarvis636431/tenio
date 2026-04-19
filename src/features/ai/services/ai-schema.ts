import { z } from "zod";

export const agentInitPayloadSchema = z.object({
  project_id: z.string().min(1),
  base_date: z.string().min(1),
  solution_id: z.number(),
  access_token: z.string().optional(),
  base_url: z.string().optional(),
});

export const agentInitResponseSchema = z
  .object({
    message: z.string().optional(),
  })
  .catchall(z.unknown());

export const agentResumePayloadSchema = z.object({
  message: z.string().min(1),
  thread_id: z.string().min(1),
  approved: z.boolean(),
});

export const agentChatPayloadSchema = z.object({
  message: z.string().min(1),
  thread_id: z.string().nullable(),
});

const streamMessageSchema = z.object({
  type: z.string().optional(),
  content: z.string().optional(),
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
    data: z.unknown().optional(),
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
