import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { getCrewData, getBudgetData, CrewData, BudgetData } from "@/services/project-service";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface FundingMaterialsProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

export function FundingMaterials(_: FundingMaterialsProps) {
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

  const buildOption = useMemo(() => {
    const formatter =
      (unit?: string) =>
      (value: number) =>
        unit ? `${value}${unit}` : value;

    return (data: CrewData[] | BudgetData[], unit?: string) => {
      if (!data || data.length === 0) {
        return null;
      }
      const categories = data[0].date ?? [];
      const series = data.map((item) => ({
        name: item.name,
        type: "line" as const,
        smooth: true,
        showSymbol: false,
        data: item.data ?? [],
        emphasis: { focus: "series" as const },
      }));

      return {
        tooltip: {
          trigger: "axis",
        },
        legend: {
          data: data.map((item) => item.name),
        },
        grid: {
          left: 40,
          right: 30,
          bottom: 40,
          top: 40,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: categories,
          axisLabel: {
            formatter: (value: number | string) => `${value}`,
          },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            formatter: formatter(unit),
          },
          splitLine: {
            lineStyle: {
              type: "dashed",
            },
          },
        },
        series,
      };
    };
  }, []);

  const crewOption = useMemo(
    () => buildOption(crewQuery.data ?? [], "人"),
    [buildOption, crewQuery.data]
  );

  const budgetOption = useMemo(
    () => buildOption(budgetQuery.data ?? [], "万元"),
    [buildOption, budgetQuery.data]
  );

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
          ) : crewOption ? (
            <ReactECharts option={crewOption} style={{ height: 320 }} />
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
          ) : budgetOption ? (
            <ReactECharts option={budgetOption} style={{ height: 320 }} />
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
