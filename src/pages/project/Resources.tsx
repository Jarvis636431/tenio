import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/hooks/useAuth";
import { getProjectCostCurve, getProjectHeadcountCurve } from "@/services/schedulepro-service";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export function Resources() {
  const { currentProject } = useProject();
  const { token } = useAuth();

  const headcountCurveQuery = useQuery({
    queryKey: ["funding-materials", "headcount-curve", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) {
        throw new Error("缺少项目 ID");
      }
      return getProjectHeadcountCurve(currentProject.id, token || undefined);
    },
    enabled: Boolean(currentProject?.id && token),
    refetchOnWindowFocus: false,
  });

  const costCurveQuery = useQuery({
    queryKey: ["funding-materials", "cost-curve", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) {
        throw new Error("缺少项目 ID");
      }
      return getProjectCostCurve(currentProject.id, token || undefined);
    },
    enabled: Boolean(currentProject?.id && token),
    refetchOnWindowFocus: false,
  });

  const headcountChartData = useMemo(() => {
    const points = headcountCurveQuery.data?.points ?? [];
    if (points.length === 0) return [];
    return points.map((point) => ({
      date: point.date,
      劳动力人数: point.headcount,
    }));
  }, [headcountCurveQuery.data]);
  const costCurveChartData = useMemo(() => {
    const points = costCurveQuery.data?.points ?? [];
    if (points.length === 0) return [];
    return points.map((point) => ({
      date: point.date,
      总成本: point.total_cost,
    }));
  }, [costCurveQuery.data]);
  
  const colors = ["#2563eb", "#16a34a", "#db2777", "#ea580c", "#8b5cf6", "#0891b2"];

  const renderChart = (data: Record<string, string | number>[], seriesNames: string[], unit: string) => {
    if (!data || data.length === 0) return null;

    return (
      <ResponsiveContainer width="100%" height={320}>
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
            tickFormatter={(value) => unit ? `${value}${unit}` : value}
          />
          <Tooltip />
          <Legend />
          {seriesNames.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  if (!currentProject) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        请选择项目后查看资金与物料数据
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>人员投入趋势</CardTitle>
          <CardDescription>展示每日劳动力总人数</CardDescription>
        </CardHeader>
        <CardContent>
          {headcountCurveQuery.isLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : headcountCurveQuery.isError ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-destructive">
              <AlertCircle className="mr-2 h-4 w-4" />
              无法获取人员数据
            </div>
          ) : headcountChartData.length > 0 ? (
            renderChart(
              headcountChartData,
              ["劳动力人数"],
              "人",
            )
          ) : (
            <div className="flex h-[320px] items-center justify-center text-muted-foreground">
              暂无人员数据
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>资金成本趋势</CardTitle>
          <CardDescription>监控人工成本、材料价格等关键指标</CardDescription>
        </CardHeader>
        <CardContent>
          {costCurveQuery.isLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : costCurveQuery.isError ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-destructive">
              <AlertCircle className="mr-2 h-4 w-4" />
              无法获取成本数据
            </div>
          ) : costCurveChartData.length > 0 ? (
            renderChart(
              costCurveChartData,
              ["总成本"],
              "万元",
            )
          ) : (
            <div className="flex h-[320px] items-center justify-center text-muted-foreground">
              暂无成本数据
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
