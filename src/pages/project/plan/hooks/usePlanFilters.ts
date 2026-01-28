import { useMemo, useState } from "react";
import type { PlanTask } from "@/types/domain/plan";

import {
  FLOOR_MATCH_PATTERN,
  FLOOR_TEST_PATTERN,
  extractFloorNumber,
} from "@/constants/plan";

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
