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

export function ProjectTrendChart({
  data,
  seriesNames,
  unit,
}: ProjectTrendChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => (unit ? `${value}${unit}` : `${value}`)}
        />
        <Tooltip />
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
