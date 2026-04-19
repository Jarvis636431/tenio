const env = import.meta.env;

export const ANALYTICS_CONFIG = {
  enabled: env.VITE_ANALYTICS_ENABLED === "true",
  debug: env.VITE_ANALYTICS_DEBUG === "true",
  endpoint: env.VITE_ANALYTICS_ENDPOINT ?? "",
  provider: env.VITE_ANALYTICS_PROVIDER ?? "noop",
};
