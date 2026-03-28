import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Overview } from "@/pages/project/Overview";
import { useAuth } from "@/hooks/useAuth";
import { useProjectStore } from "@/stores/projectStore";
import { getProjectByCode } from "@/services/project-service";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ResolvedProjectRoute() {
  const { id = "" } = useParams();
  const { token } = useAuth();
  const projects = useProjectStore((state) => state.projects);
  const currentProject = useProjectStore((state) => state.currentProject);
  const addProject = useProjectStore((state) => state.addProject);
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);
  const [resolvedProjectId, setResolvedProjectId] = useState<string>(id);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    if (!id) {
      setResolvedProjectId("");
      setIsResolving(false);
      return;
    }

    const directMatch = projects.find((project) => project.id === id);
    if (directMatch) {
      setResolvedProjectId(directMatch.id);
      setIsResolving(false);
      if (currentProject?.id !== directMatch.id) {
        setCurrentProject(directMatch);
      }
      return;
    }

    const codeMatch = projects.find((project) => project.code === id);
    if (codeMatch) {
      setResolvedProjectId(codeMatch.id);
      setIsResolving(false);
      if (currentProject?.id !== codeMatch.id) {
        setCurrentProject(codeMatch);
      }
      return;
    }

    if (UUID_PATTERN.test(id)) {
      setResolvedProjectId(id);
      setIsResolving(false);
      return;
    }

    if (!token) {
      setResolvedProjectId(id);
      setIsResolving(false);
      return;
    }

    let isMounted = true;
    setIsResolving(true);
    getProjectByCode(id, token)
      .then((response) => {
        if (!isMounted) return;
        const resolvedProject = {
          id: response.project_id,
          code: response.project_code ?? id,
          name: response.project_name ?? id,
          description: response.description,
          status: response.status,
          createdAt: response.created_at,
        };
        addProject(resolvedProject);
        setCurrentProject(resolvedProject);
        setResolvedProjectId(resolvedProject.id);
        setIsResolving(false);
      })
      .catch(() => {
        if (!isMounted) return;
        // 回退为直接按 project_id 处理
        setResolvedProjectId(id);
        setIsResolving(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, projects, currentProject?.id, token, addProject, setCurrentProject]);

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (isResolving) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  if (resolvedProjectId && resolvedProjectId !== id) {
    return <Navigate to={`/project/${resolvedProjectId}`} replace />;
  }

  return (
    <AppLayout>
      <Overview projectId={resolvedProjectId} />
    </AppLayout>
  );
}
