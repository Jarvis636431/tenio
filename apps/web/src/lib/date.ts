/**
 * 日期格式化工具函数
 */

export type DateFormat = "yyyy-mm-dd" | "yyyy/mm/dd" | "mm/dd" | "yyyy/mm";

const BASELINE_DATE = new Date(2025, 0, 1); // 2025-01-01

/**
 * 获取基准日期（用于解析相对日期格式）
 * @returns 基准日期，时间为 00:00:00
 */
function getBaselineDate(): Date {
  const baseline = new Date(BASELINE_DATE.getTime());
  baseline.setHours(0, 0, 0, 0);
  return baseline;
}

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
 * 解析多种格式的日期字符串为 Date 对象
 * 支持格式：
 * - ISO 日期字符串
 * - "2025/09/01" 或 "2025/09/01 08:00"
 * - 相对格式 "第X天 08:00" 或 "第X天"
 * - 旧格式 "8月1日"
 * @param dateStr - 日期字符串
 * @param defaultToBaseline - 解析失败时是否返回基准日期（默认 false）
 * @returns Date 对象，解析失败返回 null 或基准日期
 */
export function parseDate(dateStr: string, defaultToBaseline = false): Date | null {
  if (!dateStr) {
    return defaultToBaseline ? getBaselineDate() : null;
  }

  const trimmed = dateStr.trim();

  // 解析 ISO / 标准日期
  const isoDate = new Date(trimmed);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // 解析 "2025/09/01" 或 "2025/09/01 08:00" 格式的日期
  if (trimmed.includes("/")) {
    const [datePart, timePart] = trimmed.split(/\s+/);
    const parts = datePart.split("/");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (timePart) {
        const [hours, minutes] = timePart.split(":").map((v) => parseInt(v, 10));
        if (!Number.isNaN(hours)) {
          date.setHours(hours);
        }
        if (!Number.isNaN(minutes)) {
          date.setMinutes(minutes);
        }
      }
      return date;
    }
  }

  // 解析相对格式 "第X天 08:00" 或 "第X天08:00"
  const relativeMatch = trimmed.match(/第\s*(\d+)\s*天\s*([0-9]{1,2})(?::([0-9]{2}))?/);
  if (relativeMatch) {
    const day = parseInt(relativeMatch[1], 10);
    const hours = relativeMatch[2] ? parseInt(relativeMatch[2], 10) : 0;
    const minutes = relativeMatch[3] ? parseInt(relativeMatch[3], 10) : 0;
    const base = getBaselineDate();
    if (!Number.isNaN(day) && day > 0) {
      base.setDate(base.getDate() + day - 1);
    }
    base.setHours(hours || 0, minutes || 0, 0, 0);
    return base;
  }

  // 解析相对格式 "第X天"
  const relativeMatchNoTime = trimmed.match(/第\s*(\d+)\s*天/);
  if (relativeMatchNoTime) {
    const day = parseInt(relativeMatchNoTime[1], 10);
    const base = getBaselineDate();
    if (!Number.isNaN(day) && day > 0) {
      base.setDate(base.getDate() + day - 1);
    }
    base.setHours(0, 0, 0, 0);
    return base;
  }

  // 兼容旧的 "8月1日" 格式
  const match = trimmed.match(/(\d+)月(\d+)日/);
  if (match) {
    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const base = getBaselineDate();
    base.setMonth(month, day);
    base.setHours(0, 0, 0, 0);
    return base;
  }

  // 如果无法解析，返回基准日期或 null
  return defaultToBaseline ? getBaselineDate() : null;
}

/**
 * 简单解析日期字符串（更宽松的解析）
 * @param value - 日期字符串
 * @returns Date 对象，解析失败返回 null
 */
export function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * 将日期时间设置为中午 12:00（用于日期比较，避免时区问题）
 * @param date - 日期对象
 * @returns 新的 Date 对象，时间为 12:00:00
 */
export function normalizeToMidday(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized;
}

/**
 * 格式化日期字符串为 yyyy-mm-dd 格式
 * @param value - 日期字符串或 Date 对象
 * @returns 格式化后的字符串，无效输入返回 "-"
 */
export function formatDateString(value?: string | Date | null): string {
  if (!value) return "-";

  // 如果是 Date 对象
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "-" : value.toISOString().slice(0, 10);
  }

  // 如果已经是 yyyy-mm-dd 格式，直接返回
  if (value.length >= 10) {
    const datePart = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }

  // 尝试解析为 Date
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return value;
}
