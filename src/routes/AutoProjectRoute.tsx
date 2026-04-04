import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProject";
import {
  consumeAutoCreateProjectAfterLoginFlag,
  createProjectWithDefaultSolution,
} from "@/services/project-bootstrap";

export function AutoProjectRoute() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { currentProject, projects, addProject, setCurrentProject, isLoading } = useProject();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isBootstrappingRef = useRef(false);
  const hasAttemptedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!token || hasAttemptedRef.current || isBootstrappingRef.current) {
      return;
    }

    const run = async () => {
      hasAttemptedRef.current = true;
      const shouldAutoCreate = consumeAutoCreateProjectAfterLoginFlag();

      if (shouldAutoCreate) {
        try {
          isBootstrappingRef.current = true;
          const project = await createProjectWithDefaultSolution(token);
          if (!isMountedRef.current) return;
          addProject(project);
          setCurrentProject(project);
          navigate(`/project/${project.id}`, { replace: true });
        } catch (error) {
          if (!isMountedRef.current) return;
          setErrorMessage(error instanceof Error ? error.message : "自动创建项目失败");
        } finally {
          isBootstrappingRef.current = false;
        }
        return;
      }

      if (isLoading) {
        hasAttemptedRef.current = false;
        return;
      }

      const targetProject = currentProject ?? projects[0];
      if (targetProject) {
        navigate(`/project/${targetProject.id}`, { replace: true });
        return;
      }

      try {
        isBootstrappingRef.current = true;
        const project = await createProjectWithDefaultSolution(token);
        if (!isMountedRef.current) return;
        addProject(project);
        setCurrentProject(project);
        navigate(`/project/${project.id}`, { replace: true });
      } catch (error) {
        if (!isMountedRef.current) return;
        setErrorMessage(error instanceof Error ? error.message : "自动创建项目失败");
      } finally {
        isBootstrappingRef.current = false;
      }
    };

    void run();
  }, [token, isLoading, currentProject, projects, addProject, setCurrentProject, navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (errorMessage) {
    return (
      <div className="flex h-screen items-center justify-center px-6 text-center text-sm text-red-400">
        {errorMessage}
      </div>
    );
  }

  return <div className="flex h-screen items-center justify-center">加载中...</div>;
}
