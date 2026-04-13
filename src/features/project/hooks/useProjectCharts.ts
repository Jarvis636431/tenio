import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getProjectCostCurve,
  getProjectHeadcountCurve,
  projectQueryKeys,
} from "@/features/project";

interface UseProjectChartsOptions {
  projectId: string | null | undefined;
}

export function useProjectCharts({ projectId }: UseProjectChartsOptions) {
  const headcountQuery = useQuery({
    queryKey: projectId
      ? projectQueryKeys.headcountCurve(projectId)
      : ["overview", "headcount-curve", "empty"],
    queryFn: async () => {
      if (!projectId) {
        throw new Error("缺少项目 ID");
      }
      return getProjectHeadcountCurve(projectId);
    },
    enabled: Boolean(projectId),
    refetchOnWindowFocus: false,
  });

  const costQuery = useQuery({
    queryKey: projectId
      ? projectQueryKeys.costCurve(projectId)
      : ["overview", "cost-curve", "empty"],
    queryFn: async () => {
      if (!projectId) {
        throw new Error("缺少项目 ID");
      }
      return getProjectCostCurve(projectId);
    },
    enabled: Boolean(projectId),
    refetchOnWindowFocus: false,
  });

  const headcountChartData = useMemo(() => {
    const dates = headcountQuery.data?.dates ?? [];
    const headcounts = headcountQuery.data?.headcounts ?? [];
    const length = Math.min(dates.length, headcounts.length);
    return Array.from({ length }, (_, index) => ({
      date: dates[index],
      劳动力人数: headcounts[index],
    }));
  }, [headcountQuery.data]);

  const costCurveChart = useMemo(() => {
    const dates = costQuery.data?.dates ?? [];
    const totalCosts = costQuery.data?.total_costs ?? [];
    const numericCosts = totalCosts
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    const maxAbsCost = numericCosts.length
      ? Math.max(...numericCosts.map((value) => Math.abs(value)))
      : 0;
    const unitMeta =
      maxAbsCost >= 1e8
        ? { divisor: 1e8, unit: "亿" }
        : maxAbsCost >= 1e4
          ? { divisor: 1e4, unit: "万" }
          : { divisor: 1, unit: "元" };
    const length = Math.min(dates.length, totalCosts.length);
    return {
      unit: unitMeta.unit,
      points: Array.from({ length }, (_, index) => {
        const rawCost = Number(totalCosts[index]);
        const normalized = Number.isFinite(rawCost) ? rawCost / unitMeta.divisor : 0;
        return {
          date: dates[index],
          总成本: Number(normalized.toFixed(2)),
        };
      }),
    };
  }, [costQuery.data]);

  return {
    headcountQuery: {
      ...headcountQuery,
      chartData: headcountChartData,
    },
    costQuery: {
      ...costQuery,
      chartData: costCurveChart,
    },
  };
}
