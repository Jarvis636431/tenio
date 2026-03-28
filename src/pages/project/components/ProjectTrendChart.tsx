import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProjectTrendChartProps {
  data: Record<string, string | number>[];
  seriesNames: string[];
  unit: string;
}

const CHART_COLORS = ["#2563eb", "#16a34a", "#db2777", "#ea580c", "#8b5cf6", "#0891b2"];

function formatNumericValue(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value ?? "");
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
}

export function ProjectTrendChart({ data, seriesNames, unit }: ProjectTrendChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => (unit ? `${value}${unit}` : `${value}`)}
        />
        <Tooltip
          cursor={{ stroke: "#22d3ee", strokeOpacity: 0.35, strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: "rgba(3, 17, 42, 0.96)",
            border: "1px solid rgba(14, 116, 144, 0.7)",
            borderRadius: "8px",
            boxShadow: "0 10px 24px rgba(2, 12, 30, 0.45)",
          }}
          labelStyle={{ color: "#67e8f9", fontSize: 12, marginBottom: 6 }}
          itemStyle={{ color: "#dbeafe", fontSize: 12 }}
          formatter={(value: unknown, name: unknown) => {
            const seriesName = String(name ?? "");
            return [`${formatNumericValue(value)}${unit ? unit : ""}`, seriesName];
          }}
          labelFormatter={(label: unknown) => `日期：${String(label ?? "")}`}
        />
        {seriesNames.map((name, index) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
