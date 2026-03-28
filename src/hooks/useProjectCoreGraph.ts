import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProject";
import { getProjectCoreGraph } from "@/services/schedulepro-service";
import { getProjectByCode } from "@/services/project-service";

type UseProjectCoreGraphOptions = {
  projectId?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useProjectCoreGraph(options: UseProjectCoreGraphOptions = {}) {
  const { id: paramProjectId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const {
    currentProject,
    projects,
    coreGraphByProjectId,
    setCoreGraph,
    setCurrentProject,
    addProject,
  } = useProject();
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

    const codeMatch = projects.find((project) => project.code === projectRef);
    if (codeMatch) {
      setProjectId(codeMatch.id);
      setIsResolvingProjectId(false);
      if (currentProject?.id !== codeMatch.id) {
        setCurrentProject(codeMatch);
      }
      if (paramProjectId && paramProjectId !== codeMatch.id) {
        navigate(`/project/${codeMatch.id}`, { replace: true });
      }
      return;
    }

    if (UUID_PATTERN.test(projectRef)) {
      setProjectId(projectRef);
      setIsResolvingProjectId(false);
      return;
    }

    if (!token) {
      setProjectId("");
      setIsResolvingProjectId(false);
      return;
    }

    let isMounted = true;
    setIsResolvingProjectId(true);
    setProjectId("");
    getProjectByCode(projectRef, token)
      .then((response) => {
        if (!isMounted) return;
        const resolvedId = response.project_id;
        setProjectId(resolvedId);
        setIsResolvingProjectId(false);
        if (paramProjectId && paramProjectId !== resolvedId) {
          navigate(`/project/${resolvedId}`, { replace: true });
        }

        const existing = projects.find((project) => project.id === resolvedId);
        if (existing) {
          if (currentProject?.id !== existing.id) {
            setCurrentProject(existing);
          }
          return;
        }

        const projectName = response.project_name || projectRef;
        const normalizedProject = {
          id: resolvedId,
          code: response.project_code ?? projectRef,
          name: projectName,
          description: response.description,
          status: response.status,
          createdAt: response.created_at,
        };
        addProject(normalizedProject);
        setCurrentProject(normalizedProject);
      })
      .catch(() => {
        if (!isMounted) return;
        // projectRef 可能已经是 project_id，回退到直接使用
        setProjectId(projectRef);
        setIsResolvingProjectId(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    projectRef,
    projects,
    currentProject?.id,
    token,
    setCurrentProject,
    addProject,
    paramProjectId,
    navigate,
  ]);

  useEffect(() => {
    if (!projectId || !token || isResolvingProjectId) {
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
  }, [projectId, token, isResolvingProjectId, setCoreGraph]);

  const coreGraph = useMemo(
    () => (projectId ? coreGraphByProjectId[projectId] : undefined),
    [coreGraphByProjectId, projectId],
  );

  return {
    projectId,
    coreGraph,
    isLoading: isResolvingProjectId || Boolean(projectId && token && !coreGraph),
    isResolvingProjectId,
  };
}
