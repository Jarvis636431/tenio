import { appEnv } from "@/schemas/env";

const trimTrailingSlash = (value?: string) => value?.replace(/\/$/, "");

export const IS_DEV = appEnv.MODE === "development";

export const APP_DEFAULT_TITLE = "A.PM 智能管理平台";

function resolveBaseUrl(value: string | undefined, fallback: string, name: string) {
  const resolved = trimTrailingSlash(value);
  if (resolved) return resolved;
  if (IS_DEV) return fallback;
  throw new Error(`生产环境缺少必要配置：${name}`);
}

export const API_BASE = {
  backend: resolveBaseUrl(appEnv.VITE_API_BASE_URL, "http://localhost:3001", "VITE_API_BASE_URL"),
};
