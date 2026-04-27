import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { formatIsoDate } from "@/lib/date";
import { normalizeStatusChip } from "@/lib/task";
import type { ScheduleTask } from "../types";

interface ProjectTableProps {
  planTasks: ScheduleTask[];
  isLoading?: boolean;
}

type TaskRow = ScheduleTask & {
  level: number;
  isSum: boolean;
  chipType: "done" | "act" | "pend";
};

const columnHelper = createColumnHelper<TaskRow>();

function StatusChip({ type }: { type: "done" | "act" | "pend" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-medium ${
        type === "done"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : type === "act"
            ? "border-cyan-400/18 bg-cyan-400/[0.07] text-cyan-300"
            : "border-amber-400/20 bg-amber-400/[0.08] text-amber-300"
      }`}
    >
      {type === "done" ? "已完成" : type === "act" ? "进行中" : "待开始"}
    </span>
  );
}

const columns = [
  columnHelper.accessor("sequence_no", {
    header: "序号",
    cell: (info) => info.getValue() ?? info.row.index + 1,
    size: 50,
  }),
  columnHelper.accessor("task_name", {
    header: "工序名称",
    cell: (info) => {
      const row = info.row.original;
      const indent = row.level === 1 ? "pl-6" : row.level >= 2 ? "pl-10" : "";
      return (
        <span className={`${indent}`}>
          {row.is_critical_task && !row.isSum && (
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />
          )}
          {info.getValue()}
        </span>
      );
    },
  }),
  columnHelper.accessor("duration_days", {
    header: "工期",
    cell: (info) => {
      const val = info.getValue();
      return val ? (
        <span className="inline-block border border-cyan-400/14 bg-cyan-400/[0.07] px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">
          {val}天
        </span>
      ) : (
        "—"
      );
    },
    size: 80,
  }),
  columnHelper.accessor("start_date", {
    header: "开始时间",
    cell: (info) => {
      const val = info.getValue();
      return val ? formatIsoDate(val, true) : "—";
    },
    size: 130,
  }),
  columnHelper.accessor("end_date", {
    header: "结束时间",
    cell: (info) => {
      const val = info.getValue();
      return val ? formatIsoDate(val, true) : "—";
    },
    size: 130,
  }),
  columnHelper.accessor("predecessor_display", {
    header: "前置任务",
    cell: (info) => info.getValue() || "—",
    size: 100,
  }),
  columnHelper.accessor("chipType", {
    header: "状态",
    cell: (info) => <StatusChip type={info.getValue()} />,
    size: 90,
    enableSorting: false,
  }),
];

/**
 * 项目施工任务计划表格
 * 使用 TanStack Table 实现，支持排序和分页
 */
export function ProjectTable({ planTasks, isLoading }: ProjectTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const data = useMemo(() => {
    const sorted = [...planTasks].sort((a, b) => (a.sequence_no ?? 0) - (b.sequence_no ?? 0));
    return sorted.map((task) => {
      const level = task.indent_level ?? 0;
      const isSum = task.is_summary_task ?? level <= 1;
      const chipType = normalizeStatusChip(task.task_status);
      return { ...task, level, isSum, chipType } as TaskRow;
    });
  }, [planTasks]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-apm-muted">
        {isLoading ? "加载中..." : "当前项目暂无施工任务数据"}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="min-w-[900px] overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-[rgba(0,18,50,0.97)]">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const SortIcon = sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : null;
                  return (
                    <th
                      key={header.id}
                      className="border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          disabled={!canSort}
                          className={`flex items-center gap-1 ${canSort ? "cursor-pointer hover:text-cyan-400" : "cursor-default"}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-[8px] opacity-60">
                              {SortIcon || <ArrowUpDown className="h-3 w-3" />}
                            </span>
                          )}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-cyan-400/[0.04] transition hover:bg-cyan-400/[0.025] ${
                  row.original.isSum ? "bg-[rgba(0,28,60,0.5)]" : ""
                }`}
              >
                {row.getVisibleCells().map((cell) => {
                  const isSum = cell.row.original.isSum;
                  const isDateCell =
                    cell.column.id === "start_date" || cell.column.id === "end_date";
                  return (
                    <td
                      key={cell.id}
                      className={`px-3 py-2 ${isSum && isDateCell ? "font-semibold text-white" : ""} ${
                        isSum && cell.column.id === "task_name" ? "font-semibold text-white" : ""
                      } ${
                        isSum
                          ? ""
                          : cell.column.id === "task_name"
                            ? "text-[rgba(200,215,235,0.72)]"
                            : "text-apm-dim"
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between border-t border-cyan-400/10 px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] text-apm-dim">
          <span>共 {table.getFilteredRowModel().rows.length} 条</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded border border-cyan-400/20 bg-transparent px-1.5 py-0.5 text-[11px] text-apm-dim"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} 条/页
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="rounded px-2 py-1 text-[11px] text-apm-dim transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {"<<"}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded px-2 py-1 text-[11px] text-apm-dim transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {"<"}
          </button>
          <span className="text-[11px] text-apm-dim">
            第 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} 页
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded px-2 py-1 text-[11px] text-apm-dim transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {">"}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="rounded px-2 py-1 text-[11px] text-apm-dim transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {">>"}
          </button>
        </div>
      </div>
    </div>
  );
}
