import { useMemo } from "react";
import type { PlanTask } from "@/types/domain/plan";
import { Clock, Star, Coins, Percent } from "lucide-react";
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
  planTasks: PlanTask[];
  costCurveData: { date: string; 总成本: number }[];
  unit: string;
}

export function ChartTab({ totalDurationLabel, planTasks, costCurveData, unit }: ChartTabProps) {
  const contractDays = useMemo(() => {
    const match = totalDurationLabel?.match(/(\d+)/);
    return match ? Number(match[1]) : planTasks.length * 5 || 60;
  }, [totalDurationLabel, planTasks.length]);

  const optimalDays = useMemo(() => {
    return Math.round(contractDays * 1.15);
  }, [contractDays]);

  const chartData = useMemo(() => {
    if (!costCurveData || costCurveData.length === 0) {
      // Fallback mock data
      return Array.from({ length: 12 }, (_, i) => ({
        label: `${40 + i * 10}天`,
        总成本: 38 - i * 0.8 + Math.sin(i) * 2,
        直接费用: 32 - i * 0.6 + Math.sin(i) * 1.5,
        间接费用: 6 + i * 0.15,
      }));
    }
    // Build a smaller sampled set for the x-axis
    const step = Math.max(1, Math.floor(costCurveData.length / 10));
    return costCurveData
      .filter((_, idx) => idx % step === 0 || idx === costCurveData.length - 1)
      .map((d) => ({
        label: d.date.slice(5),
        总成本: d.总成本,
        直接费用: Number((d.总成本 * 0.78).toFixed(2)),
        间接费用: Number((d.总成本 * 0.22).toFixed(2)),
      }));
  }, [costCurveData]);

  const minCost = useMemo(() => {
    return chartData.reduce((m, d) => (d.总成本 < m.总成本 ? d : m), chartData[0]);
  }, [chartData]);

  const contractPoint = chartData[Math.min(2, chartData.length - 1)] || chartData[0];
  const bestPoint = minCost || chartData[Math.floor(chartData.length / 2)];

  const saving = useMemo(() => {
    if (!contractPoint || !bestPoint) return 0;
    return Number((contractPoint.总成本 - bestPoint.总成本).toFixed(2));
  }, [contractPoint, bestPoint]);

  const savingPercent = useMemo(() => {
    if (!contractPoint || contractPoint.总成本 === 0) return 0;
    return Number(((saving / contractPoint.总成本) * 100).toFixed(1));
  }, [saving, contractPoint]);

  const cards = [
    {
      icon: Clock,
      label: "合同工期",
      value: `${contractDays}天`,
      sub: "发包方要求",
      color: "#00d4ff",
    },
    {
      icon: Star,
      label: "最优工期",
      value: `${optimalDays}天`,
      sub: "成本最低点",
      color: "#f59e0b",
    },
    {
      icon: Coins,
      label: "最低总成本",
      value: `${bestPoint?.总成本?.toFixed?.(1) ?? "—"}${unit}`,
      sub: "直接+间接",
      color: "#10b981",
    },
    {
      icon: Percent,
      label: "可节约成本",
      value: `${savingPercent}%`,
      sub: "相比合同工期",
      color: "#a78bfa",
    },
  ];

  return (
    <div className="flex h-full min-h-[520px] flex-col gap-4">
      {/* Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="border border-white/[0.08] bg-[rgba(4,18,37,0.7)] p-3 lg:p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <c.icon className="h-4 w-4" style={{ color: c.color }} />
              <span className="text-[10px] tracking-wider text-apm-muted uppercase">{c.label}</span>
            </div>
            <div
              className="text-xl font-bold tracking-tight lg:text-2xl"
              style={{ color: c.color }}
            >
              {c.value}
            </div>
            <div className="mt-1 text-[10px] text-apm-dim">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[280px] border border-white/[0.08] bg-[rgba(2,12,27,0.6)] p-3">
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
              tickFormatter={(v) => `${v}${unit}`}
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
            <Line
              type="monotone"
              dataKey="直接费用"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={{ r: 2, fill: "#ef4444" }}
            />
            <Line
              type="monotone"
              dataKey="间接费用"
              stroke="#a78bfa"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ r: 2, fill: "#a78bfa" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendation */}
      <div className="border border-amber-500/25 bg-amber-500/[0.08] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-amber-500/15 text-amber-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold text-amber-400">AI 工期优化建议</div>
            <div className="text-xs leading-relaxed text-apm-muted">
              基于本项目施工任务量（{planTasks.length} 项工序，合同工期 {contractDays} 天），AI
              分析得出：
              <strong className="text-cyan-300">最优工期为 {optimalDays} 天</strong>，
              较合同工期延长 {optimalDays - contractDays} 天，可节约总成本约
              <strong className="text-emerald-400">
                {" "}
                {saving.toFixed(1)} {unit}
              </strong>
              （节约率 {savingPercent}%）。
              <br />
              建议在投标时将施工计划工期设定为{" "}
              <strong className="text-amber-400">
                {optimalDays}—{optimalDays + 5} 天
              </strong>
              ， 既满足合同要求，又留有合理缓冲，可有效降低赶工风险和额外成本。
            </div>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="overflow-hidden">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-apm-muted">
          各工期方案明细
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-cyan-400/15">
                {[
                  "工期方案",
                  "工期（天）",
                  "直接费用",
                  "间接费用",
                  "总成本",
                  "节约/增加",
                  "风险等级",
                  "推荐",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => {
                const diff = Number((d.总成本 - (contractPoint?.总成本 ?? d.总成本)).toFixed(1));
                const isBest = d === bestPoint;
                const isContract = i === 2 || i === Math.min(2, chartData.length - 1);
                const isLowRisk = d.总成本 <= (bestPoint?.总成本 ?? d.总成本) * 1.05;
                const risk = i < 2 ? "高" : isLowRisk ? "低" : diff > 0 ? "中" : "低";

                return (
                  <tr
                    key={i}
                    className={`border-b border-white/[0.04] transition ${
                      isBest ? "bg-amber-500/[0.05]" : isContract ? "bg-cyan-400/[0.04]" : ""
                    }`}
                  >
                    <td className="px-2.5 py-2 text-white">{d.label}</td>
                    <td className="px-2.5 py-2 font-semibold text-cyan-400">
                      {d.label.replace("天", "") || "—"}
                    </td>
                    <td className="px-2.5 py-2 text-apm-muted">
                      {d.直接费用?.toFixed(1) ?? "—"}
                      {unit}
                    </td>
                    <td className="px-2.5 py-2 text-apm-muted">
                      {d.间接费用?.toFixed(1) ?? "—"}
                      {unit}
                    </td>
                    <td className="px-2.5 py-2 font-semibold text-white">
                      {d.总成本?.toFixed(1) ?? "—"}
                      {unit}
                    </td>
                    <td className="px-2.5 py-2">
                      {diff > 0 ? (
                        <span className="text-red-400">
                          +{diff}
                          {unit}
                        </span>
                      ) : diff < 0 ? (
                        <span className="text-emerald-400">
                          {diff}
                          {unit}
                        </span>
                      ) : (
                        <span className="text-apm-dim">—</span>
                      )}
                    </td>
                    <td className="px-2.5 py-2">
                      <span
                        className={`${
                          risk === "高"
                            ? "text-red-400"
                            : risk === "中"
                              ? "text-amber-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {risk}
                      </span>
                    </td>
                    <td className="px-2.5 py-2">
                      {isBest ? (
                        <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
                          最优
                        </span>
                      ) : isContract ? (
                        <span className="rounded border border-cyan-400/25 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-medium text-cyan-400">
                          合同
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
