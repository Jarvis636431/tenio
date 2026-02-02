const env = import.meta.env;

const trimTrailingSlash = (value?: string) => value?.replace(/\/$/, "");

export const IS_DEV = env.MODE === "development";

export const APP_DEFAULT_TITLE = "A.PM 智能管理平台";

export const API_BASE = {
  userService: trimTrailingSlash(env.VITE_USER_SERVICE_URL) ?? "http://localhost:8001",
  projectService: trimTrailingSlash(env.VITE_PROJECT_SERVICE_URL) ?? "http://localhost:8002",
  poiService: trimTrailingSlash(env.VITE_POI_SERVICE_URL) ?? "https://chat.zrzz.site",
};

export const AMAP = {
  key: env.VITE_AMAP_KEY ?? "",
  securityCode: env.VITE_AMAP_SECURITY_CODE ?? "",
};

export const AI_SSE_URL = env.VITE_AI_SSE_URL ?? "";
