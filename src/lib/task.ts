/**
 * 任务相关工具函数
 */

/**
 * 判断任务是否为 Lag 任务（虚工作）
 * @param taskName - 任务名称
 * @returns 是否为 Lag 任务
 */
export function isLagTask(taskName?: string): boolean {
  return (taskName ?? "").trim().toLowerCase().startsWith("lag");
}

/**
 * 格式化工期天数
 * @param value - 工期值（字符串或数字）
 * @returns 格式化后的字符串，保留一位小数
 */
export function formatDurationDays(value?: string | number): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(1);
  }
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(numeric)) {
      return numeric.toFixed(1);
    }
  }
  return "";
}

/**
 * 格式化工人数
 * @param count - 工人数（任意类型）
 * @returns 格式化后的字符串
 */
export function formatWorkerCount(count: unknown): string {
  const value = Number(count);
  if (!Number.isFinite(value)) return "0";
  return String(Math.round(value));
}
