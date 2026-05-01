import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { projectQueryKeys } from "../queryKeys";
import {
  getLatestCrewPlanArtifact,
  getLatestDocumentArtifact,
  getLatestGraphArtifact,
  getLatestTimeCostArtifact,
} from "../services/project-api";
import type { CrewPlanArtifact, DocumentArtifact, TimeCostArtifact } from "../types";
import { useProject } from "./useProject";

interface UseProjectDataOptions {
  projectId?: string;
}

interface CostCurvePoint {
  date: string;
  总成本: number;
}

function mapTimeCostArtifactToCostCurve(artifact?: TimeCostArtifact | null): CostCurvePoint[] {
  if (!artifact) return [];

  const optionPoints = artifact.options
    .map((option, index) => {
      const rawCost =
        typeof option.total_cost_cents === "number"
          ? option.total_cost_cents / 100
          : option.total_cost;
      if (typeof rawCost !== "number" || !Number.isFinite(rawCost)) return null;
      const label =
        option.option_name ??
        (typeof option.duration_days === "number"
          ? `方案${option.duration_days}天`
          : `方案${index + 1}`);
      return {
        date: label,
        总成本: Number(rawCost.toFixed(2)),
      };
    })
    .filter((point): point is CostCurvePoint => point !== null);

  if (optionPoints.length > 0) return optionPoints;

  if (Number.isFinite(artifact.minimum_total_cost_cents)) {
    return [
      {
        date: `最优${artifact.optimal_duration_days}天`,
        总成本: Number((artifact.minimum_total_cost_cents / 100).toFixed(2)),
      },
    ];
  }

  return [];
}

function getDocumentContent(artifact?: DocumentArtifact | null): string {
  if (!artifact) return "";
  return artifact.content_markdown;
}

export function useProjectData({ projectId: propsProjectId }: UseProjectDataOptions = {}) {
  const { id: paramProjectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, projects } = useProject();

  const projectRef = propsProjectId || paramProjectId || currentProject?.project_id || "";
  const matchedProject = useMemo(
    () => projects.find((project) => project.project_id === projectRef),
    [projects, projectRef],
  );
  const resolvedProjectId = matchedProject?.project_id ?? projectRef;

  useEffect(() => {
    if (paramProjectId && matchedProject && paramProjectId !== matchedProject.project_id) {
      navigate(`/project/${matchedProject.project_id}`, { replace: true });
    }
  }, [paramProjectId, matchedProject, navigate]);

  const graphQuery = useQuery({
    queryKey: resolvedProjectId
      ? projectQueryKeys.graphArtifact(resolvedProjectId)
      : ["project", "artifact", "graph", "empty"],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getLatestGraphArtifact(resolvedProjectId);
    },
    enabled: Boolean(resolvedProjectId),
    refetchOnWindowFocus: false,
  });

  const graphArtifact = graphQuery.data;
  const isLoadingGraph = graphQuery.isLoading;
  const planTasks = useMemo(() => graphArtifact?.graph ?? [], [graphArtifact]);

  // ===== useOverviewMetrics 逻辑 =====
  const currentProjectName = useMemo(() => {
    if (!projectRef && !resolvedProjectId) {
      return currentProject?.project_name || "项目详情";
    }
    const project =
      matchedProject ?? projects.find((item) => item.project_id === resolvedProjectId);
    return project?.project_name || currentProject?.project_name || "项目详情";
  }, [projectRef, resolvedProjectId, matchedProject, projects, currentProject]);

  const totalDurationLabel = useMemo(() => {
    const totalDurationDays =
      graphArtifact?.summary?.total_duration_days ??
      graphArtifact?.version_summary?.total_duration_days;
    if (totalDurationDays) return `${totalDurationDays}天`;
    return "";
  }, [graphArtifact]);

  const costQuery = useQuery({
    queryKey: resolvedProjectId
      ? projectQueryKeys.timeCostArtifact(resolvedProjectId)
      : ["project", "artifact", "time-cost", "empty"],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getLatestTimeCostArtifact(resolvedProjectId);
    },
    enabled: Boolean(resolvedProjectId),
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

  const documentQuery = useQuery({
    queryKey: resolvedProjectId
      ? projectQueryKeys.documentArtifact(resolvedProjectId)
      : ["project", "artifact", "document", "empty"],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getLatestDocumentArtifact(resolvedProjectId);
    },
    enabled: Boolean(resolvedProjectId),
    refetchOnWindowFocus: false,
  });

  const documentContent = useMemo(
    () => getDocumentContent(documentQuery.data),
    [documentQuery.data],
  );
  const documentArtifact: DocumentArtifact | undefined = documentQuery.data;

  const crewPlanQuery = useQuery({
    queryKey: resolvedProjectId
      ? projectQueryKeys.crewPlanArtifact(resolvedProjectId)
      : ["project", "artifact", "crew-plan", "empty"],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getLatestCrewPlanArtifact(resolvedProjectId);
    },
    enabled: Boolean(resolvedProjectId),
    refetchOnWindowFocus: false,
  });

  const crewPlanArtifact: CrewPlanArtifact | undefined = crewPlanQuery.data;

  return {
    resolvedProjectId,
    graphArtifact,
    isLoadingGraph,
    planTasks,
    currentProjectName,
    totalDurationLabel,
    costQuery: {
      ...costQuery,
      chartData: costCurveChart,
    },
    documentQuery,
    documentArtifact,
    documentContent,
    crewPlanQuery,
    crewPlanArtifact,
  };
}
