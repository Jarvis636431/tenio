import { ANALYTICS_CONFIG } from "@/analytics/config";
import { ConsoleAnalyticsProvider, NoopAnalyticsProvider } from "@/analytics/providers";
import { parseAnalyticsContext, parseAnalyticsPayload } from "@/analytics/schema";
import type {
  AnalyticsContext,
  AnalyticsEventEnvelope,
  AnalyticsEventMap,
  AnalyticsEventName,
  AnalyticsProvider,
  AnalyticsTrackOptions,
} from "@/analytics/types";

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}`;
}

function resolveDefaultProvider(): AnalyticsProvider {
  if (!ANALYTICS_CONFIG.enabled) {
    return new NoopAnalyticsProvider();
  }

  if (ANALYTICS_CONFIG.provider === "console" || ANALYTICS_CONFIG.debug) {
    return new ConsoleAnalyticsProvider();
  }

  return new NoopAnalyticsProvider();
}

/**
 * 统一管理埋点上下文、provider 与发送入口。
 */
export class AnalyticsClient {
  private provider: AnalyticsProvider;
  private context: AnalyticsContext;

  constructor(
    provider: AnalyticsProvider = resolveDefaultProvider(),
    initialContext: AnalyticsContext = {},
  ) {
    this.provider = provider;
    this.context = {
      sessionId: createSessionId(),
      ...initialContext,
    };
  }

  /**
   * 替换当前 provider。
   *
   * @param provider - 新的 provider 实现
   */
  setProvider(provider: AnalyticsProvider) {
    this.provider = provider;
  }

  /**
   * 合并更新默认上下文。
   *
   * @param partialContext - 要更新的上下文字段
   */
  setContext(partialContext: Partial<AnalyticsContext>) {
    this.context = parseAnalyticsContext({
      ...this.context,
      ...partialContext,
    });
  }

  /**
   * 获取当前上下文快照。
   *
   * @returns 当前上下文
   */
  getContext(): AnalyticsContext {
    return { ...this.context };
  }

  /**
   * 标记当前用户或会话。
   *
   * @param context - 用户或会话上下文
   */
  identify(context: AnalyticsContext) {
    this.setContext(parseAnalyticsContext(context));
    void this.provider.identify?.(this.getContext());
  }

  /**
   * 上报事件。
   *
   * @param name - 事件名
   * @param payload - 事件负载
   * @param options - 发送选项与临时上下文
   */
  track<TName extends AnalyticsEventName>(
    name: TName,
    payload: AnalyticsEventMap[TName],
    options?: AnalyticsTrackOptions & { context?: Partial<AnalyticsContext> },
  ) {
    const parsedContext = parseAnalyticsContext({
      ...this.context,
      ...options?.context,
    });
    const parsedPayload = parseAnalyticsPayload(name, payload);
    const event: AnalyticsEventEnvelope<TName> = {
      name,
      payload: parsedPayload,
      context: parsedContext,
      timestamp: new Date().toISOString(),
    };

    if (name === "page_view" && this.provider.page) {
      void this.provider.page(event as AnalyticsEventEnvelope<"page_view">);
      return;
    }

    void this.provider.track(event);
  }

  /**
   * 重置上下文与 provider 状态。
   */
  reset() {
    this.context = {
      sessionId: createSessionId(),
    };
    void this.provider.reset?.();
  }
}

export const analytics = new AnalyticsClient();
