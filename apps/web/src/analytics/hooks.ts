import { useEffect } from "react";
import { analytics } from "@/analytics/analytics";
import { ANALYTICS_EVENTS } from "@/analytics/events";
import type { AnalyticsContext, AnalyticsEventMap, AnalyticsEventName } from "@/analytics/types";

/**
 * 在组件生命周期内同步埋点上下文。
 *
 * @param context - 需要注入的公共上下文
 */
export function useAnalyticsContext(context: Partial<AnalyticsContext>) {
  useEffect(() => {
    analytics.setContext(context);
  }, [context]);
}

/**
 * 返回一个带类型约束的埋点发送函数。
 *
 * @returns 发送埋点的方法
 */
export function useTrackEvent() {
  return <TName extends AnalyticsEventName>(
    name: TName,
    payload: AnalyticsEventMap[TName],
    context?: Partial<AnalyticsContext>,
  ) => {
    analytics.track(name, payload, { context });
  };
}

/**
 * 页面浏览埋点 Hook。
 *
 * @param path - 页面路径
 * @param title - 页面标题
 * @param context - 额外上下文
 */
export function usePageTracking(path: string, title?: string, context?: Partial<AnalyticsContext>) {
  useEffect(() => {
    analytics.track(
      ANALYTICS_EVENTS.pageView,
      {
        path,
        title,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
      },
      { context },
    );
  }, [context, path, title]);
}
