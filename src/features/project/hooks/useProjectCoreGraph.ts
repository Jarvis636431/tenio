import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProject } from "./useProject";
import { getProjectCoreGraph } from "../services/schedulepro-service";

type UseProjectCoreGraphOptions = {
  projectId?: string;
};

export function useProjectCoreGraph(options: UseProjectCoreGraphOptions = {}) {
  const { id: paramProjectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, projects, coreGraphByProjectId, setCoreGraph, setCurrentProject } =
    useProject();
  const projectRef = options.projectId || paramProjectId || currentProject?.id || "";
  const [projectId, setProjectId] = useState("");
  const [isResolvingProjectId, setIsResolvingProjectId] = useState(Boolean(projectRef));

  useEffect(() => {
    if (!projectRef) {
      setProjectId("");
      setIsResolvingProjectId(false);
      return;
    }

    const directMatch = projects.find((project) => project.id === projectRef);
    if (directMatch) {
      setProjectId(directMatch.id);
      setIsResolvingProjectId(false);
      if (paramProjectId && paramProjectId !== directMatch.id) {
        navigate(`/project/${directMatch.id}`, { replace: true });
      }
      return;
    }

    setProjectId(projectRef);
    setIsResolvingProjectId(false);
  }, [projectRef, projects, currentProject?.id, setCurrentProject, paramProjectId, navigate]);

  useEffect(() => {
    if (!projectId || isResolvingProjectId) {
      return;
    }

    let isMounted = true;
    getProjectCoreGraph(projectId)
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
  }, [projectId, isResolvingProjectId, setCoreGraph]);

  const coreGraph = useMemo(
    () => (projectId ? coreGraphByProjectId[projectId] : undefined),
    [coreGraphByProjectId, projectId],
  );

  return {
    projectId,
    coreGraph,
    isLoading: isResolvingProjectId || Boolean(projectId && !coreGraph),
    isResolvingProjectId,
  };
}
