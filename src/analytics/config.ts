import { appEnv } from "@/schemas/env";

export const ANALYTICS_CONFIG = {
  enabled: appEnv.VITE_ANALYTICS_ENABLED,
  debug: appEnv.VITE_ANALYTICS_DEBUG,
  endpoint: appEnv.VITE_ANALYTICS_ENDPOINT ?? "",
  provider: appEnv.VITE_ANALYTICS_PROVIDER ?? "noop",
};
