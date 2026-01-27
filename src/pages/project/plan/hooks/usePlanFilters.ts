import { useMemo, useState } from "react";
import type { PlanTask } from "@/types/domain/plan";

const CHINESE_NUMBER_MAP: Record<string, number> = {
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

const FLOOR_MATCH_PATTERN =
  /(?:地下|负[一二三四五六七八九十]*)?(\d+)(?:层|F|楼)|负[一二三四五六七八九十]+层|基础层|首层|屋面层|顶层/gi;
const FLOOR_TEST_PATTERN =
  /(?:地下|负[一二三四五六七八九十]*)?(\d+)(?:层|F|楼)|负[一二三四五六七八九十]+层|基础层|首层|屋面层|顶层/i;

function extractFloorNumber(floor: string): number {
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

export function usePlanFilters(tasks: PlanTask[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");

  const jobTypes = useMemo(() => {
    const types = new Set(tasks.map((item) => item.jobType).filter(Boolean));
    return Array.from(types);
  }, [tasks]);

  const floorTypes = useMemo(() => {
    const floorSet = new Set<string>();
    let hasOthers = false;

    tasks.forEach((item) => {
      const floorMatches = item.task.match(FLOOR_MATCH_PATTERN);
      if (floorMatches) {
        floorMatches.forEach((match) => {
          floorSet.add(match);
        });
      } else {
        hasOthers = true;
      }
    });

    const floors = Array.from(floorSet);
    const sortedFloors = floors.sort((a, b) => {
      const numA = extractFloorNumber(a);
      const numB = extractFloorNumber(b);

      const isUndergroundA = a.includes("地下") || a.includes("负");
      const isUndergroundB = b.includes("地下") || b.includes("负");
      if (isUndergroundA && !isUndergroundB) return -1;
      if (!isUndergroundA && isUndergroundB) return 1;

      if (isUndergroundA && isUndergroundB) {
        return numA - numB;
      }

      const isFirstFloorA = a.includes("首层");
      const isFirstFloorB = b.includes("首层");
      if (isFirstFloorA && !isFirstFloorB && !isUndergroundB) return -1;
      if (!isFirstFloorA && isFirstFloorB && !isUndergroundA) return 1;

      const isOtherSpecialA =
        a.includes("基础") || a.includes("屋面") || a.includes("顶层");
      const isOtherSpecialB =
        b.includes("基础") || b.includes("屋面") || b.includes("顶层");
      if (isOtherSpecialA && !isOtherSpecialB) return 1;
      if (!isOtherSpecialA && isOtherSpecialB) return -1;

      if (isOtherSpecialA && isOtherSpecialB) {
        return a.localeCompare(b);
      }

      return numA - numB;
    });

    if (hasOthers) {
      sortedFloors.push("其他");
    }

    return sortedFloors;
  }, [tasks]);

  const filteredData = useMemo(() => {
    return tasks.filter((item) => {
      const matchesSearch = item.task
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesJob = jobFilter === "all" || item.jobType === jobFilter;

      let matchesFloor = false;
      if (floorFilter === "all") {
        matchesFloor = true;
      } else if (floorFilter === "其他") {
        const hasFloorInfo = FLOOR_TEST_PATTERN.test(item.task);
        matchesFloor = !hasFloorInfo;
      } else {
        matchesFloor = item.task.includes(floorFilter);
      }

      return matchesSearch && matchesJob && matchesFloor;
    });
  }, [tasks, searchTerm, jobFilter, floorFilter]);

  return {
    searchTerm,
    setSearchTerm,
    jobFilter,
    setJobFilter,
    floorFilter,
    setFloorFilter,
    jobTypes,
    floorTypes,
    filteredData,
  };
}
