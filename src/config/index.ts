import { appEnv } from "@/schemas/env";

const trimTrailingSlash = (value?: string) => value?.replace(/\/$/, "");

export const IS_DEV = appEnv.MODE === "development";

export const APP_DEFAULT_TITLE = "A.PM 智能管理平台";
const apiBaseUrl = trimTrailingSlash(appEnv.VITE_API_BASE_URL);
const aiServiceUrl = trimTrailingSlash(appEnv.VITE_AI_SERVICE_URL) ?? "http://127.0.0.1:8123";

export const API_BASE = {
  backend: apiBaseUrl ?? "http://localhost:8000",
  aiService: aiServiceUrl,
};

export const VOLC_SPEECH = {
  apiUrl: "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash",
  resourceId: "volc.bigasr.auc_turbo",
  appId: appEnv.VITE_VOLC_APP_ID ?? "",
  accessToken: appEnv.VITE_VOLC_ACCESS_TOKEN ?? "",
};
