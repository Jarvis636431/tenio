/**
 * 数组工具函数
 */

/**
 * 获取 seqNo 的数值，支持 string | number | undefined 类型
 * @param seqNo - 序号值
 * @returns 数值，无效时返回 Number.MAX_SAFE_INTEGER
 */
export function getSeqNoValue(seqNo: string | number | undefined): number {
  if (typeof seqNo === "number") return seqNo;
  if (typeof seqNo === "string") {
    const parsed = Number(seqNo);
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
  }
  return Number.MAX_SAFE_INTEGER;
}

/**
 * 按 seqNo 排序的比较函数
 * @returns 比较结果，用于 Array.sort()
 */
export function compareBySeqNo(
  a: { seqNo?: string | number },
  b: { seqNo?: string | number },
): number {
  return getSeqNoValue(a.seqNo) - getSeqNoValue(b.seqNo);
}

/**
 * 按 seqNo 排序数组（升序）
 * @param items - 需要排序的数组
 * @returns 排序后的新数组
 */
export function sortBySeqNo<T extends { seqNo?: string | number }>(items: T[]): T[] {
  return [...items].sort(compareBySeqNo);
}

/**
 * 查找数组中的最大值
 * @param items - 数值数组
 * @returns 最大值，空数组返回 undefined
 */
export function max(items: number[]): number | undefined {
  if (items.length === 0) return undefined;
  return Math.max(...items);
}

/**
 * 查找数组中的最小值
 * @param items - 数值数组
 * @returns 最小值，空数组返回 undefined
 */
export function min(items: number[]): number | undefined {
  if (items.length === 0) return undefined;
  return Math.min(...items);
}

/**
 * 分组函数
 * @param items - 数组
 * @param keyFn - 获取分组键的函数
 * @returns 分组后的 Map
 */
export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}
