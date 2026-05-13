export type AnalyticsEventName =
  | "page_view"
  | "click"
  | "upload_select_file"
  | "upload_start"
  | "upload_success"
  | "upload_fail"
  | "ai_panel_open"
  | "ai_send_message"
  | "ai_resume_interrupt"
  | "ai_voice_start"
  | "ai_voice_success"
  | "api_error"
  | "render_error";

export interface AnalyticsEventMap {
  page_view: {
    path: string;
    title?: string;
    referrer?: string;
  };
  click: {
    element: string;
    location?: string;
    label?: string;
  };
  upload_select_file: {
    category?: string;
    fileCount: number;
  };
  upload_start: {
    category?: string;
    fileName?: string;
  };
  upload_success: {
    category?: string;
    fileId?: string;
    durationMs?: number;
  };
  upload_fail: {
    category?: string;
    reason: string;
  };
  ai_panel_open: {
    projectId?: string;
    source?: string;
  };
  ai_send_message: {
    projectId?: string;
    inputMethod?: "text" | "voice";
  };
  ai_resume_interrupt: {
    projectId?: string;
    approved: boolean;
  };
  ai_voice_start: {
    projectId?: string;
  };
  ai_voice_success: {
    projectId?: string;
    durationMs?: number;
  };
  api_error: {
    path: string;
    method?: string;
    status?: number;
    message?: string;
  };
  render_error: {
    scope: string;
    message: string;
  };
}

export interface AnalyticsContext {
  route?: string;
  projectId?: string;
  sessionId?: string;
  userId?: string;
}

export interface AnalyticsEventEnvelope<TName extends AnalyticsEventName = AnalyticsEventName> {
  name: TName;
  payload: AnalyticsEventMap[TName];
  context: AnalyticsContext;
  timestamp: string;
}

export interface AnalyticsProvider {
  readonly name: string;
  identify?(context: AnalyticsContext): void | Promise<void>;
  track<TName extends AnalyticsEventName>(
    event: AnalyticsEventEnvelope<TName>,
  ): void | Promise<void>;
  page?(event: AnalyticsEventEnvelope<"page_view">): void | Promise<void>;
  reset?(): void | Promise<void>;
}

export interface AnalyticsTrackOptions {
  immediate?: boolean;
}
