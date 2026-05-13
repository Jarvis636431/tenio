import type { AnalyticsEventMap, AnalyticsEventName } from "@/analytics/types";

export const ANALYTICS_EVENTS = {
  pageView: "page_view",
  click: "click",
  uploadSelectFile: "upload_select_file",
  uploadStart: "upload_start",
  uploadSuccess: "upload_success",
  uploadFail: "upload_fail",
  aiPanelOpen: "ai_panel_open",
  aiSendMessage: "ai_send_message",
  aiResumeInterrupt: "ai_resume_interrupt",
  aiVoiceStart: "ai_voice_start",
  aiVoiceSuccess: "ai_voice_success",
  apiError: "api_error",
  renderError: "render_error",
} as const satisfies Record<string, AnalyticsEventName>;

/**
 * 创建一个带类型约束的埋点负载。
 *
 * @param name - 事件名
 * @param payload - 事件负载
 * @returns 事件名与负载的组合对象
 */
export function createAnalyticsEvent<TName extends AnalyticsEventName>(
  name: TName,
  payload: AnalyticsEventMap[TName],
) {
  return { name, payload };
}
