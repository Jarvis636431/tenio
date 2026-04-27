import { useMemo } from "react";
import { Clock, Coins, ListChecks, TrendingDown } from "lucide-react";
import type { ScheduleTask } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ChartTabProps {
  totalDurationLabel: string;
  planTasks: ScheduleTask[];
  costCurveData: { date: string; 总成本: number }[];
  unit: string;
}

export function ChartTab({ totalDurationLabel, planTasks, costCurveData, unit }: ChartTabProps) {
  const formatLabel = (value: string) =>
    /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(5) : value;

  const chartData = useMemo(() => {
    if (!costCurveData || costCurveData.length === 0) {
      return [];
    }
    const step = Math.max(1, Math.floor(costCurveData.length / 10));
    return costCurveData
      .filter((_, index) => index % step === 0 || index === costCurveData.length - 1)
      .map((item) => ({
        label: formatLabel(item.date),
        总成本: item.总成本,
      }));
  }, [costCurveData]);

  const minCost = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((min, item) => (item.总成本 < min.总成本 ? item : min), chartData[0]);
  }, [chartData]);

  const maxCost = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, item) => (item.总成本 > max.总成本 ? item : max), chartData[0]);
  }, [chartData]);

  const latestCost = chartData.at(-1) ?? null;

  const cards = [
    {
      icon: Clock,
      label: "计划工期",
      value: totalDurationLabel || "—",
      sub: "根据工序计划计算",
      color: "#00d4ff",
    },
    {
      icon: ListChecks,
      label: "工序数量",
      value: `${planTasks.length}`,
      sub: "核心图工序",
      color: "#f59e0b",
    },
    {
      icon: Coins,
      label: "最新总成本",
      value: `${latestCost?.总成本?.toFixed?.(1) ?? "—"}${latestCost ? unit : ""}`,
      sub: latestCost?.label ?? "暂无数据",
      color: "#10b981",
    },
    {
      icon: TrendingDown,
      label: "最低总成本",
      value: `${minCost?.总成本?.toFixed?.(1) ?? "—"}${minCost ? unit : ""}`,
      sub: minCost?.label ?? "暂无数据",
      color: "#a78bfa",
    },
  ];

  return (
    <div className="flex h-full min-h-[520px] flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border border-white/[0.08] bg-[rgba(4,18,37,0.7)] p-3 lg:p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
              <span className="text-[10px] tracking-wider text-apm-muted uppercase">
                {card.label}
              </span>
            </div>
            <div
              className="text-xl font-bold tracking-tight lg:text-2xl"
              style={{ color: card.color }}
            >
              {card.value}
            </div>
            <div className="mt-1 text-[10px] text-apm-dim">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="h-[280px] border border-white/[0.08] bg-[rgba(2,12,27,0.6)] p-3">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(0,212,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(160,180,204,0.6)", fontSize: 11 }}
                axisLine={{ stroke: "rgba(0,212,255,0.1)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(160,180,204,0.6)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}${unit}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(4,18,37,0.95)",
                  border: "1px solid rgba(0,212,255,0.3)",
                }}
                labelStyle={{ color: "#00d4ff", fontSize: 12 }}
                itemStyle={{ color: "rgba(160,180,204,0.9)", fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value}${unit}`, name]}
              />
              <Line
                type="monotone"
                dataKey="总成本"
                stroke="#00d4ff"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#00d4ff" }}
                activeDot={{ r: 6 }}
                fill="rgba(0,212,255,0.08)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-apm-muted">
            暂无成本曲线数据
          </div>
        )}
      </div>

      <div className="border border-amber-500/25 bg-amber-500/[0.08] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-amber-500/15 text-amber-400">
            <TrendingDown className="h-4 w-4" />
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold text-amber-400">成本曲线摘要</div>
            <div className="text-xs leading-relaxed text-apm-muted">
              {latestCost && minCost && maxCost ? (
                <>
                  当前项目共有 {planTasks.length} 项工序，计划工期为{" "}
                  <strong className="text-cyan-300">{totalDurationLabel || "—"}</strong>。
                  成本曲线最新点为
                  <strong className="text-emerald-400">
                    {" "}
                    {latestCost.总成本.toFixed(1)} {unit}
                  </strong>
                  ，最低点出现在 {minCost.label}（{minCost.总成本.toFixed(1)} {unit}
                  ），最高点出现在 {maxCost.label}（{maxCost.总成本.toFixed(1)} {unit}）。
                  <br />
                  这里仅展示后端返回的成本曲线摘要，未补造工期优化结论。
                </>
              ) : (
                "暂无足够的成本曲线数据生成摘要。"
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-apm-muted">
          成本曲线明细
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-cyan-400/15">
                {["日期", "总成本", "曲线位置"].map((heading) => (
                  <th
                    key={heading}
                    className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, index) => {
                const isMin = item === minCost;
                const isMax = item === maxCost;
                const isLatest = index === chartData.length - 1;

                return (
                  <tr
                    key={`${item.label}-${index}`}
                    className={`border-b border-white/[0.04] transition ${
                      isMin ? "bg-amber-500/[0.05]" : isLatest ? "bg-cyan-400/[0.04]" : ""
                    }`}
                  >
                    <td className="px-2.5 py-2 text-white">{item.label}</td>
                    <td className="px-2.5 py-2 font-semibold text-white">
                      {item.总成本?.toFixed(1) ?? "—"}
                      {unit}
                    </td>
                    <td className="px-2.5 py-2">
                      {isMin ? (
                        <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
                          最低
                        </span>
                      ) : isMax ? (
                        <span className="rounded border border-red-400/25 bg-red-400/10 px-1.5 py-0.5 text-[9px] font-medium text-red-400">
                          最高
                        </span>
                      ) : isLatest ? (
                        <span className="rounded border border-cyan-400/25 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-medium text-cyan-400">
                          最新
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
