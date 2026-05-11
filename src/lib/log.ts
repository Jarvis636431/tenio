import { ANALYTICS_CONFIG } from "@/analytics/config";
import { IS_DEV } from "@/config";

/**
 * 静默记录错误到控制台（仅在非生产环境或调试模式下）
 *
 * @param prefix - 日志前缀，如 "[AI语音]"
 * @param message - 日志消息
 * @param error - 可选的错误对象
 */
export function logSilentError(prefix: string, message: string, error?: unknown) {
  if (!IS_DEV && !ANALYTICS_CONFIG.debug) {
    return;
  }

  if (error) {
    console.warn(`${prefix} ${message}`, error);
    return;
  }
  console.warn(`${prefix} ${message}`);
}
