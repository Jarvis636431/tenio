import type { AnalyticsEventEnvelope, AnalyticsProvider } from "@/analytics/types";

export class NoopAnalyticsProvider implements AnalyticsProvider {
  readonly name = "noop";

  track(_event: AnalyticsEventEnvelope) {
    return;
  }
}
