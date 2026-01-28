export const CHINESE_NUMBER_MAP: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

export const FLOOR_MATCH_PATTERN =
  /(?:地下|负[一二三四五六七八九十]*)?(\d+)(?:层|F|楼)|负[一二三四五六七八九十]+层|基础层|首层|屋面层|顶层/gi;

export const FLOOR_TEST_PATTERN =
  /(?:地下|负[一二三四五六七八九十]*)?(\d+)(?:层|F|楼)|负[一二三四五六七八九十]+层|基础层|首层|屋面层|顶层/i;

export function extractFloorNumber(floor: string): number {
  if (floor.includes("负")) {
    const chineseNum = floor.match(/负([一二三四五六七八九十]+)/)?.[1];
    if (chineseNum) {
      return -(CHINESE_NUMBER_MAP[chineseNum] || 1);
    }
    const arabicNum = floor.match(/负(\d+)/)?.[1];
    if (arabicNum) {
      return -parseInt(arabicNum, 10);
    }
  }
  return parseInt(floor.match(/\d+/)?.[0] || "0", 10);
}
