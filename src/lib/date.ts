/**
 * 日期格式化工具函数
 */

export type DateFormat = "yyyy-mm-dd" | "yyyy/mm/dd" | "mm/dd" | "yyyy/mm";

/**
 * 将 Date 对象格式化为指定格式的字符串
 * @param date - 日期对象（可选，默认为当前时间）
 * @param format - 格式模板，默认为 "yyyy-mm-dd"
 * @returns 格式化后的日期字符串，如果 date 无效则返回空字符串
 */
export function formatDate(date?: Date | null, format: DateFormat = "yyyy-mm-dd"): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  switch (format) {
    case "yyyy-mm-dd":
      return `${y}-${m}-${d}`;
    case "yyyy/mm/dd":
      return `${y}/${m}/${d}`;
    case "mm/dd":
      return `${m}/${d}`;
    case "yyyy/mm":
      return `${y}/${Number(date.getMonth()) + 1}`;
    default:
      return `${y}-${m}-${d}`;
  }
}

/**
 * 格式化日期时间为 yyyy-mm-dd hh:mm 格式
 * @param date - 日期对象或 ISO 字符串（可选）
 * @returns 格式化后的日期时间字符串，如果输入无效则返回 "-"
 */
export function formatDateTime(date?: Date | string | null): string {
  if (!date) return "-";

  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";

  const dateStr = formatDate(d, "yyyy-mm-dd");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dateStr} ${h}:${min}`;
}

/**
 * 从 ISO 日期字符串中提取 yyyy-mm-dd 或 yyyy-mm-dd hh:mm 格式
 * @param value - ISO 日期字符串（可选）
 * @param includeTime - 是否包含时间（默认为 false）
 * @returns 格式化后的字符串，如果输入无效则返回 "-"
 */
export function formatIsoDate(value?: string | null, includeTime = false): string {
  if (!value) return "-";

  // 如果已经是截断格式（如 2024-01-15 或 2024-01-15T10:30），直接返回
  if (includeTime && value.length >= 16) {
    return value.slice(0, 16).replace("T", " ");
  }
  if (!includeTime && value.length >= 10) {
    return value.slice(0, 10);
  }

  return value;
}

/**
 * 获取当前日期字符串
 * @param format - 格式模板，默认为 "yyyy-mm-dd"
 * @returns 当前日期的格式化字符串
 */
export function getCurrentDate(format: DateFormat = "yyyy-mm-dd"): string {
  return formatDate(new Date(), format);
}

/**
 * 获取一周的起始日期（周一）和结束日期（周日）
 * @param date - 参考日期（可选，默认为当前日期）
 * @returns 包含周一和周日日期的对象
 */
export function getWeekRange(date?: Date): { monday: Date; sunday: Date } {
  const target = date ? new Date(date) : new Date();
  target.setHours(0, 0, 0, 0);

  const day = target.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;

  const monday = new Date(target);
  monday.setDate(target.getDate() - diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { monday, sunday };
}
