const env = import.meta.env;

const trimTrailingSlash = (value?: string) => value?.replace(/\/$/, "");

export const IS_DEV = env.MODE === "development";

export const APP_DEFAULT_TITLE = "A.PM 智能管理平台";
const apiBaseUrl = trimTrailingSlash(env.VITE_API_BASE_URL);
const aiServiceUrl = trimTrailingSlash(env.VITE_AI_SERVICE_URL) ?? "http://127.0.0.1:8123";

export const API_BASE = {
  userService: trimTrailingSlash(env.VITE_USER_SERVICE_URL) ?? apiBaseUrl ?? "http://localhost:8001",
  projectService:
    trimTrailingSlash(env.VITE_PROJECT_SERVICE_URL) ?? apiBaseUrl ?? "http://localhost:8002",
  aiService: aiServiceUrl,
};

export const AMAP = {
  key: env.VITE_AMAP_KEY ?? "",
  securityCode: env.VITE_AMAP_SECURITY_CODE ?? "",
};

export const AI_SSE_URL = env.VITE_AI_SSE_URL ?? `${aiServiceUrl}/api/agent/chat/sse`;

export const RESOURCE_BASE_URL =
  trimTrailingSlash(env.VITE_RESOURCE_BASE_URL) ?? "https://apmoss.emio.cn/public/resources";

export const VOLC_SPEECH = {
  apiUrl: "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash",
  resourceId: "volc.bigasr.auc_turbo",
  appId: env.VITE_VOLC_APP_ID ?? "",
  accessToken: env.VITE_VOLC_ACCESS_TOKEN ?? "",
  secretKey: env.VITE_VOLC_SECRET_KEY ?? "",
};
