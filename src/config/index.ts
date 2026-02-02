const env = import.meta.env;

const trimTrailingSlash = (value?: string) => value?.replace(/\/$/, "");

export const IS_DEV = env.MODE === "development";

export const APP_DEFAULT_TITLE = "A.PM 智能管理平台";

export const API_BASE = {
  userService: trimTrailingSlash(env.VITE_USER_SERVICE_URL) ?? "http://localhost:8001",
  projectService: trimTrailingSlash(env.VITE_PROJECT_SERVICE_URL) ?? "http://localhost:8002",
};

export const AMAP = {
  key: env.VITE_AMAP_KEY ?? "",
  securityCode: env.VITE_AMAP_SECURITY_CODE ?? "",
};

export const SSE_BASE = trimTrailingSlash(env.VITE_SSE_URL) ?? API_BASE.projectService;
