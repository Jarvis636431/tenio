import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectQueryKeys } from "@/features/project";
import { getLatestTimeCostArtifact } from "../services/project-api";
import { mapTimeCostArtifactToCostCurve } from "../services/overview-artifact-mapper";

interface UseProjectChartsOptions {
  projectId: string | null | undefined;
}

export function useProjectCharts({ projectId }: UseProjectChartsOptions) {
  const costQuery = useQuery({
    queryKey: projectId
      ? projectQueryKeys.timeCostArtifact(projectId)
      : ["project", "artifact", "time-cost", "empty"],
    queryFn: async () => {
      if (!projectId) {
        throw new Error("缺少项目 ID");
      }
      return getLatestTimeCostArtifact(projectId);
    },
    enabled: Boolean(projectId),
    refetchOnWindowFocus: false,
  });

  const costCurveChart = useMemo(() => {
    const points = mapTimeCostArtifactToCostCurve(costQuery.data);
    const totalCosts = points.map((point) => point.总成本);
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
    return {
      unit: unitMeta.unit,
      points: points.map((point) => {
        const rawCost = Number(point.总成本);
        const normalized = Number.isFinite(rawCost) ? rawCost / unitMeta.divisor : 0;
        return {
          date: point.date,
          总成本: Number(normalized.toFixed(2)),
        };
      }),
    };
  }, [costQuery.data]);

  return {
    costQuery: {
      ...costQuery,
      chartData: costCurveChart,
    },
  };
}
