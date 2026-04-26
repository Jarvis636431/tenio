import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useProject, projectQueryKeys } from "@/features/project";
import { getLatestScheduleArtifact } from "@/services/apm-api";
import { mapScheduleArtifactToPlanTasks } from "../services/overview-artifact-mapper";

interface UseProjectDataOptions {
  projectId?: string;
}

export function useProjectData({ projectId: propsProjectId }: UseProjectDataOptions = {}) {
  const { id: paramProjectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, projects } = useProject();

  const projectRef = propsProjectId || paramProjectId || currentProject?.id || "";
  const matchedProject = useMemo(
    () => projects.find((project) => project.id === projectRef),
    [projects, projectRef],
  );
  const resolvedProjectId = matchedProject?.id ?? projectRef;

  useEffect(() => {
    if (paramProjectId && matchedProject && paramProjectId !== matchedProject.id) {
      navigate(`/project/${matchedProject.id}`, { replace: true });
    }
  }, [paramProjectId, matchedProject, navigate]);

  const scheduleQuery = useQuery({
    queryKey: resolvedProjectId
      ? projectQueryKeys.scheduleArtifact(resolvedProjectId)
      : ["project", "artifact", "schedule", "empty"],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getLatestScheduleArtifact(resolvedProjectId);
    },
    enabled: Boolean(resolvedProjectId),
    refetchOnWindowFocus: false,
  });

  const scheduleArtifact = scheduleQuery.data;
  const isLoadingGraph = scheduleQuery.isLoading;
  const planTasks = useMemo(
    () => mapScheduleArtifactToPlanTasks(scheduleArtifact),
    [scheduleArtifact],
  );

  // ===== useOverviewMetrics 逻辑 =====
  const currentProjectName = useMemo(() => {
    if (!projectRef && !resolvedProjectId) {
      return currentProject?.name || "项目详情";
    }
    const project = matchedProject ?? projects.find((item) => item.id === resolvedProjectId);
    return project?.name || currentProject?.name || "项目详情";
  }, [projectRef, resolvedProjectId, matchedProject, projects, currentProject]);

  const totalDurationLabel = useMemo(() => {
    if (scheduleArtifact?.total_duration_days) return `${scheduleArtifact.total_duration_days}天`;
    return "";
  }, [scheduleArtifact]);

  return {
    resolvedProjectId,
    scheduleArtifact,
    isLoadingGraph,
    planTasks,
    currentProjectName,
    totalDurationLabel,
  };
}
