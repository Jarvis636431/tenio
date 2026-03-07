import { useMemo } from "react";
import type { CoreGraphResponse } from "@/types/domain/schedulepro";

export function usePlanExport(coreGraph?: CoreGraphResponse) {
  const tasks = useMemo(() => {
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
      const workerCount = wp.team_size ?? wp.suggested_team_count ?? 0;
      return {
        任务名称: wp.name || wp.code || "未命名工序",
        施工方式: wp.selected_method?.name ?? "",
        工种: wp.trade?.name ?? "",
        施工人数: workerCount,
        开始时间: exec?.planned_start_datetime ?? "",
        结束时间: exec?.planned_end_datetime ?? "",
        持续时长: wp.duration_days ? `${wp.duration_days}天` : "",
        实际工作天数: wp.duration_days ?? 0,
        是否加班: "否",
        施工情况: exec?.status ?? "",
        选定施工方式: wp.selected_method?.name ?? "",
        前置工序: (depsByTarget.get(wp.id) ?? []).join(", "),
        直接依赖任务: "",
        层数: 0,
        工程量: wp.quantity ?? 0,
        工程量单位: wp.unit ?? "",
        材料价格: wp.material_cost ?? 0,
        劳动力成本: wp.labor_cost ?? 0,
        总成本:
          (wp.labor_cost ?? 0) +
          (wp.material_cost ?? 0) +
          (wp.device_rental_cost ?? 0),
        备注: "",
      };
    });
  }, [coreGraph]);

  const handleExportCSV = () => {
    if (tasks.length === 0) {
      console.warn("没有可导出的任务数据");
      return;
    }

    const headers = Object.keys(tasks[0]);
    const csvContent = [
      headers.join(","),
      ...tasks.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            if (
              typeof value === "string" &&
              (value.includes(",") ||
                value.includes('"') ||
                value.includes("\n"))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `施工任务清单_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { handleExportCSV };
}
