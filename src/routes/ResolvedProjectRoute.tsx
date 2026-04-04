import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Overview } from "@/pages/project/Overview";
import { useProjectStore } from "@/stores/projectStore";

export function ResolvedProjectRoute() {
  const { id = "" } = useParams();
  const projects = useProjectStore((state) => state.projects);
  const currentProject = useProjectStore((state) => state.currentProject);
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

    setResolvedProjectId(id);
    setIsResolving(false);
  }, [id, projects, currentProject?.id, setCurrentProject]);

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
