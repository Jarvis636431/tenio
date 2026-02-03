import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProject";
import { getProjectCoreGraph } from "@/services/schedulepro-service";

export function useProjectCoreGraph() {
  const { id: paramProjectId } = useParams();
  const { token } = useAuth();
  const { currentProject, coreGraphByProjectId, setCoreGraph } = useProject();
  const projectId = paramProjectId || currentProject?.id || "";

  useEffect(() => {
    if (!projectId || !token) {
      return;
    }

    let isMounted = true;
    getProjectCoreGraph(projectId, token)
      .then((response) => {
        if (!isMounted) return;
        setCoreGraph(projectId, response);
      })
      .catch(() => {
        // 页面自行处理错误提示
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, token, setCoreGraph]);

  const coreGraph = useMemo(
    () => (projectId ? coreGraphByProjectId[projectId] : undefined),
    [coreGraphByProjectId, projectId],
  );

  return {
    projectId,
    coreGraph,
    isLoading: Boolean(projectId && token && !coreGraph),
  };
}
