import { z } from "zod";

const optionalString = z.union([z.string(), z.undefined()]).transform((value) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
});

const optionalUrl = z.union([z.url(), z.literal(""), z.undefined()]).transform((value) => {
  if (!value) return undefined;
  return value.trim();
});

const booleanFlag = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

export const envSchema = z.object({
  MODE: z.string().default("development"),
  VITE_API_BASE_URL: optionalUrl,
  VITE_AI_SERVICE_URL: optionalUrl,
  VITE_VOLC_APP_ID: optionalString,
  VITE_VOLC_ACCESS_TOKEN: optionalString,
  VITE_ANALYTICS_ENABLED: booleanFlag,
  VITE_ANALYTICS_DEBUG: booleanFlag,
  VITE_ANALYTICS_ENDPOINT: optionalUrl,
  VITE_ANALYTICS_PROVIDER: optionalString,
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * 校验并规范化运行时环境变量。
 *
 * @param rawEnv - 原始 import.meta.env
 * @returns 通过 schema 校验后的环境变量
 */
export function parseEnv(rawEnv: unknown): AppEnv {
  return envSchema.parse(rawEnv);
}

export const appEnv = parseEnv(import.meta.env);
