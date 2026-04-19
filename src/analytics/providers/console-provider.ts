import type { AnalyticsEventEnvelope, AnalyticsProvider } from "@/analytics/types";

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  readonly name = "console";

  track(event: AnalyticsEventEnvelope) {
    console.info("[analytics]", event.name, event);
  }

  page(event: AnalyticsEventEnvelope<"page_view">) {
    console.info("[analytics:page]", event.payload.path, event);
  }

  reset() {
    console.info("[analytics] reset");
  }
}
