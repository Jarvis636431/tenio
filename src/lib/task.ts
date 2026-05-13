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

/**
 * 根据状态字符串返回对应的 chip 类型
 * @param status - 状态字符串
 * @returns chip 类型: done(完成) | act(进行中) | pend(待开始)
 */
export function normalizeStatusChip(status?: string): "done" | "act" | "pend" {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("完成") || s.includes("done") || s.includes("end")) return "done";
  if (s.includes("进行") || s.includes("active") || s.includes("start")) return "act";
  return "pend";
}
