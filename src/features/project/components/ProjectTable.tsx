import { formatIsoDate } from "@/lib/date";
import { sortBySeqNo } from "@/lib/array";
import { normalizeStatusChip, resolveOutlineLevel } from "@/lib/task";
import type { PlanTask } from "@/types/domain/plan";
import type { CoreGraphResponse } from "@/types/domain/schedulepro";

interface ProjectTableProps {
  planTasks: PlanTask[];
  isLoading?: boolean;
  coreGraph?: CoreGraphResponse;
}

/**
 * 项目施工任务计划表格
 * 显示任务序号、工序名称、工期、开始/结束时间、前置任务和状态
 */
export function ProjectTable({ planTasks, isLoading, coreGraph }: ProjectTableProps) {
  const processTableRows = sortBySeqNo(planTasks);
  const formatDateTime = (value?: string) => formatIsoDate(value, true);

  if (planTasks.length === 0) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-apm-muted">
        {isLoading ? "加载中..." : "当前项目暂无施工任务数据"}
      </div>
    );
  }

  return (
    <div className="min-w-[900px]">
      <table className="w-full border-collapse text-[12px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[rgba(0,18,50,0.97)]">
            <th className="w-[50px] border-b border-cyan-400/18 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
              序号
            </th>
            <th className="border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
              工序名称
            </th>
            <th className="w-[80px] border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
              工期
            </th>
            <th className="w-[130px] border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
              开始时间
            </th>
            <th className="w-[130px] border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
              结束时间
            </th>
            <th className="w-[100px] border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
              前置任务
            </th>
            <th className="w-[90px] border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
              状态
            </th>
          </tr>
        </thead>
        <tbody>
          {processTableRows.map((task, idx) => {
            const wp = coreGraph?.work_processes?.find((w) => w.id === task.id);
            const level = resolveOutlineLevel(wp);
            const isSum = level === 0 || level === 1;
            const chipType = normalizeStatusChip(task.constructionSituation);

            return (
              <tr
                key={task.id}
                className={`border-b border-cyan-400/[0.04] transition hover:bg-cyan-400/[0.025] ${
                  isSum ? "bg-[rgba(0,28,60,0.5)]" : ""
                }`}
              >
                <td
                  className={`px-3 py-2 text-center text-[10px] text-apm-dim ${
                    isSum ? "font-semibold text-white" : ""
                  }`}
                >
                  {task.seqNo ?? idx + 1}
                </td>
                <td
                  className={`px-3 py-2 ${
                    level === 1 ? "pl-6" : level >= 2 ? "pl-10" : ""
                  } ${isSum ? "font-semibold text-white" : "text-[rgba(200,215,235,0.72)]"}`}
                >
                  {task.criticalPath && !isSum && (
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />
                  )}
                  {task.task}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-block border border-cyan-400/14 bg-cyan-400/[0.07] px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">
                    {task.duration || "—"}
                  </span>
                </td>
                <td
                  className={`px-3 py-2 text-slate-300 ${isSum ? "font-semibold text-white" : ""}`}
                >
                  {formatDateTime(task.startTime)}
                </td>
                <td
                  className={`px-3 py-2 text-slate-300 ${isSum ? "font-semibold text-white" : ""}`}
                >
                  {formatDateTime(task.endTime)}
                </td>
                <td className="px-3 py-2 text-[11px] text-apm-dim">
                  {task.prerequisiteProcess || "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-medium ${
                      chipType === "done"
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        : chipType === "act"
                          ? "border-cyan-400/18 bg-cyan-400/[0.07] text-cyan-300"
                          : "border-amber-400/20 bg-amber-400/[0.08] text-amber-300"
                    }`}
                  >
                    {chipType === "done" ? "已完成" : chipType === "act" ? "进行中" : "待开始"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
