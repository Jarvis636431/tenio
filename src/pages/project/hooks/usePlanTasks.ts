import { useMemo } from "react";
import type { PlanTask } from "@/types/domain/plan";
import type { CoreGraphResponse } from "@/types/domain/schedulepro";

function resolvePlannedRange(wp: NonNullable<CoreGraphResponse["work_processes"]>[number]) {
  const exec = wp.execution_state;
  if (!exec) return { start: "", end: "" };
  const start = exec.planned_start_datetime ?? "";
  const end = exec.planned_end_datetime ?? "";
  if (start && end) return { start, end };
  const intervals = exec.planned_intervals ?? [];
  if (intervals.length === 0) return { start, end };
  const starts = intervals
    .map((item) => new Date(item.start_datetime).getTime())
    .filter((value) => !Number.isNaN(value));
  const ends = intervals
    .map((item) => new Date(item.end_datetime).getTime())
    .filter((value) => !Number.isNaN(value));
  if (!starts.length || !ends.length) return { start, end };
  return {
    start: new Date(Math.min(...starts)).toISOString(),
    end: new Date(Math.max(...ends)).toISOString(),
  };
}

export function usePlanTasks(coreGraph?: CoreGraphResponse | null): PlanTask[] {
  return useMemo(() => {
    if (!coreGraph?.work_processes?.length) return [];

    const depsByTarget = new Map<string, string[]>();
    coreGraph.dependencies?.forEach((dep) => {
      const toId = dep.to_work_process_id ?? dep.successor_id;
      const fromId = dep.from_work_process_id ?? dep.predecessor_id;
      if (!toId || !fromId) return;
      const list = depsByTarget.get(toId) ?? [];
      list.push(fromId);
      depsByTarget.set(toId, list);
    });

    return coreGraph.work_processes.map((wp) => {
      const exec = wp.execution_state;
      const { start, end } = resolvePlannedRange(wp);
      const workerCount = wp.team_size ?? wp.suggested_team_count ?? 0;
      const jobType = wp.trade?.name ?? "";
      return {
        id: wp.id,
        seqNo: wp.seq_no,
        task: wp.name || wp.code || "未命名工序",
        workerCount,
        jobType,
        totalCost: (wp.labor_cost ?? 0) + (wp.material_cost ?? 0) + (wp.device_rental_cost ?? 0),
        startTime: start,
        endTime: end,
        constructionSituation: exec?.status ?? "",
        prerequisiteProcess: (depsByTarget.get(wp.id) ?? []).join(", "),
        quantity: wp.quantity ?? 0,
        quantityUnit: wp.unit ?? "",
        overtime: "否",
        duration: wp.duration_days ? `${wp.duration_days}天` : "",
        actualWorkDays: wp.duration_days ?? 0,
        constructionMethod: wp.selected_method?.name ?? "",
        directDependency: "",
        remarks: "",
        selectedConstructionMethod: wp.selected_method?.name ?? "",
        materialCost: wp.material_cost ?? 0,
        laborCost: wp.labor_cost ?? 0,
        floor: 0,
        criticalPath: exec?.critical_path ?? false,
        worker: jobType,
        count: workerCount,
        startDate: start,
        endDate: end,
      } as PlanTask;
    });
  }, [coreGraph]);
}
