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
import {
  getCrewData,
  getBudgetData,
  CrewData,
  BudgetData,
} from "@/services/project-service";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export function FundingMaterials() {
  const { currentProject } = useProject();
  const { token } = useAuth();

  const crewQuery = useQuery({
    queryKey: ["funding-materials", "crew", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) {
        throw new Error("缺少项目 ID");
      }
      return getCrewData(currentProject.id, token || undefined);
    },
    enabled: Boolean(currentProject?.id && token),
    refetchOnWindowFocus: false,
  });

  const budgetQuery = useQuery({
    queryKey: ["funding-materials", "budget", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) {
        throw new Error("缺少项目 ID");
      }
      return getBudgetData(currentProject.id, token || undefined);
    },
    enabled: Boolean(currentProject?.id && token),
    refetchOnWindowFocus: false,
  });

  const transformData = (data: CrewData[] | BudgetData[]) => {
    if (!data || data.length === 0) return [];
    
    // Assuming all series share the same date categories
    const categories = data[0].date ?? [];
    
    return categories.map((date, index) => {
      const point: Record<string, string | number> = { date };
      data.forEach(series => {
        point[series.name] = series.data?.[index] ?? 0;
      });
      return point;
    });
  };

  const crewChartData = useMemo(() => transformData(crewQuery.data ?? []), [crewQuery.data]);
  const budgetChartData = useMemo(() => transformData(budgetQuery.data ?? []), [budgetQuery.data]);
  
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
          <CardDescription>展示不同工种的每日投入人数</CardDescription>
        </CardHeader>
        <CardContent>
          {crewQuery.isLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : crewQuery.isError ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-destructive">
              <AlertCircle className="mr-2 h-4 w-4" />
              无法获取人员数据
            </div>
          ) : crewChartData.length > 0 ? (
            renderChart(
              crewChartData,
              (crewQuery.data ?? []).map((d) => d.name),
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
          {budgetQuery.isLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : budgetQuery.isError ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-destructive">
              <AlertCircle className="mr-2 h-4 w-4" />
              无法获取成本数据
            </div>
          ) : budgetChartData.length > 0 ? (
            renderChart(
              budgetChartData,
              (budgetQuery.data ?? []).map((d) => d.name),
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
