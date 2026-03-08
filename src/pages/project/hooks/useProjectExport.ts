import { useMemo } from "react";
import type { CoreGraphResponse } from "@/types/domain/schedulepro";

type ProjectExportOptions = {
  projectName?: string;
  projectLocation?: string;
  periodStart?: string;
  periodEnd?: string;
  plannedWorkerCount?: number;
  actualWorkerCount?: number;
  weeklyTaskNames?: string[];
  progressStatus?: "超前" | "符合计划" | "滞后";
  remark?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function useProjectExport(
  coreGraph?: CoreGraphResponse,
  options: ProjectExportOptions = {},
) {
  const taskNames = useMemo(() => {
    if (!coreGraph?.work_processes?.length) return [];
    return coreGraph.work_processes.map(
      (wp) => wp.name || wp.code || "未命名工序",
    );
  }, [coreGraph]);

  const handleExportDOC = () => {
    const weeklyTasks =
      options.weeklyTaskNames?.length
        ? options.weeklyTaskNames
        : taskNames.slice(0, 3).map((task) => String(task));
    const plannedWorkers =
      typeof options.plannedWorkerCount === "number"
        ? String(options.plannedWorkerCount)
        : "";
    const actualWorkers =
      typeof options.actualWorkerCount === "number"
        ? String(options.actualWorkerCount)
        : "";
    const periodText =
      options.periodStart && options.periodEnd
        ? `${options.periodStart}-${options.periodEnd}`
        : options.periodStart || options.periodEnd || "";
    const status = options.progressStatus ?? "符合计划";
    const statusAhead = status === "超前" ? "☑" : "☐";
    const statusOnTrack = status === "符合计划" ? "☑" : "☐";
    const statusDelayed = status === "滞后" ? "☑" : "☐";

    const weeklyTaskLines = weeklyTasks
      .slice(0, 20)
      .map((name, index) => `<div>${index + 1}. ${escapeHtml(name)}</div>`)
      .join("");

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>施工用工及进度管控周报</title>
  <style>
    body { font-family: "Songti SC", "SimSun", serif; font-size: 18px; line-height: 1.9; margin: 56px 68px; color: #111; }
    h1 { text-align: center; font-size: 28px; font-weight: 600; margin: 10px 0 64px; }
    .section { margin-bottom: 40px; }
    .line { margin: 12px 0; }
    .label { display: inline-block; min-width: 180px; }
    .tasks { margin-top: 8px; padding-left: 0; }
    .status { margin-top: 26px; }
  </style>
</head>
<body>
  <h1>施工用工及进度管控周报</h1>
  <div class="section">
    <div class="line"><span class="label">项目名称：</span>${escapeHtml(options.projectName ?? "")}</div>
    <div class="line"><span class="label">项目地点：</span>${escapeHtml(options.projectLocation ?? "")}</div>
    <div class="line"><span class="label">日期：</span>${escapeHtml(periodText)}</div>
  </div>
  <div class="section">
    <div class="line"><span class="label">计划用工人数：</span>${escapeHtml(plannedWorkers)}</div>
    <div class="line"><span class="label">实际用工人数：</span>${escapeHtml(actualWorkers)}</div>
    <div class="line"><span class="label">本周施工内容：</span></div>
    <div class="tasks">${weeklyTaskLines || "<div>1. </div><div>2. </div><div>3. </div>"}</div>
  </div>
  <div class="section status">
    <div class="line"><span class="label">总体进度情况：</span>${statusAhead}超前 ${statusOnTrack}符合计划 ${statusDelayed}滞后</div>
  </div>
  <div class="section">
    <div class="line"><span class="label">补充：</span>${escapeHtml(options.remark ?? "")}</div>
  </div>
</body>
</html>`;

    const blob = new Blob(["\ufeff", html], {
      type: "application/msword;charset=utf-8",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `施工用工及进度管控周报_${new Date().toISOString().split("T")[0]}.doc`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { handleExportDOC };
}
