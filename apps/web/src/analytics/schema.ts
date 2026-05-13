import { z } from "zod";
import type { AnalyticsContext, AnalyticsEventMap, AnalyticsEventName } from "@/analytics/types";

export const analyticsContextSchema = z.object({
  route: z.string().optional(),
  projectId: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
});

const analyticsPayloadSchemas = {
  page_view: z.object({
    path: z.string().min(1),
    title: z.string().optional(),
    referrer: z.string().optional(),
  }),
  click: z.object({
    element: z.string().min(1),
    location: z.string().optional(),
    label: z.string().optional(),
  }),
  upload_select_file: z.object({
    category: z.string().optional(),
    fileCount: z.number().int().nonnegative(),
  }),
  upload_start: z.object({
    category: z.string().optional(),
    fileName: z.string().optional(),
  }),
  upload_success: z.object({
    category: z.string().optional(),
    fileId: z.string().optional(),
    durationMs: z.number().nonnegative().optional(),
  }),
  upload_fail: z.object({
    category: z.string().optional(),
    reason: z.string().min(1),
  }),
  ai_panel_open: z.object({
    projectId: z.string().optional(),
    source: z.string().optional(),
  }),
  ai_send_message: z.object({
    projectId: z.string().optional(),
    inputMethod: z.enum(["text", "voice"]).optional(),
  }),
  ai_resume_interrupt: z.object({
    projectId: z.string().optional(),
    approved: z.boolean(),
  }),
  ai_voice_start: z.object({
    projectId: z.string().optional(),
  }),
  ai_voice_success: z.object({
    projectId: z.string().optional(),
    durationMs: z.number().nonnegative().optional(),
  }),
  api_error: z.object({
    path: z.string().min(1),
    method: z.string().optional(),
    status: z.number().int().nonnegative().optional(),
    message: z.string().optional(),
  }),
  render_error: z.object({
    scope: z.string().min(1),
    message: z.string().min(1),
  }),
} satisfies {
  [K in AnalyticsEventName]: z.ZodType<AnalyticsEventMap[K]>;
};

export const analyticsEnvelopeSchema = z.discriminatedUnion("name", [
  z.object({
    name: z.literal("page_view"),
    payload: analyticsPayloadSchemas.page_view,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("click"),
    payload: analyticsPayloadSchemas.click,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("upload_select_file"),
    payload: analyticsPayloadSchemas.upload_select_file,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("upload_start"),
    payload: analyticsPayloadSchemas.upload_start,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("upload_success"),
    payload: analyticsPayloadSchemas.upload_success,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("upload_fail"),
    payload: analyticsPayloadSchemas.upload_fail,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("ai_panel_open"),
    payload: analyticsPayloadSchemas.ai_panel_open,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("ai_send_message"),
    payload: analyticsPayloadSchemas.ai_send_message,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("ai_resume_interrupt"),
    payload: analyticsPayloadSchemas.ai_resume_interrupt,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("ai_voice_start"),
    payload: analyticsPayloadSchemas.ai_voice_start,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("ai_voice_success"),
    payload: analyticsPayloadSchemas.ai_voice_success,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("api_error"),
    payload: analyticsPayloadSchemas.api_error,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
  z.object({
    name: z.literal("render_error"),
    payload: analyticsPayloadSchemas.render_error,
    context: analyticsContextSchema,
    timestamp: z.iso.datetime(),
  }),
]);

/**
 * 校验并规范化埋点上下文。
 *
 * @param context - 埋点上下文
 * @returns 校验通过后的上下文
 */
export function parseAnalyticsContext(context: unknown): AnalyticsContext {
  return analyticsContextSchema.parse(context);
}

/**
 * 按事件名校验对应的 payload。
 *
 * @param name - 事件名
 * @param payload - 事件负载
 * @returns 校验通过后的负载
 */
export function parseAnalyticsPayload<TName extends AnalyticsEventName>(
  name: TName,
  payload: unknown,
): AnalyticsEventMap[TName] {
  return analyticsPayloadSchemas[name].parse(payload);
}
