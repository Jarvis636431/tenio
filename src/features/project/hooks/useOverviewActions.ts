import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProjectWithDefaultSolution } from "@/services/project-bootstrap";
import type { PlanTask } from "@/types/domain/plan";
import type { Project } from "@/types/domain/project";

interface UseOverviewActionsOptions {
  addProject: (project: Project) => void;
  setCurrentProject: (project: Project | null) => void;
}

interface UseOverviewActionsResult {
  isTaskDetailDialogOpen: boolean;
  setIsTaskDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTaskForDetail: PlanTask | null;
  handleResetProject: () => Promise<void>;
  handleTaskDetail: (task: PlanTask) => void;
}

export function useOverviewActions({
  addProject,
  setCurrentProject,
}: UseOverviewActionsOptions): UseOverviewActionsResult {
  const navigate = useNavigate();
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<PlanTask | null>(null);

  const handleResetProject = async () => {
    try {
      const newProject = await createProjectWithDefaultSolution();
      addProject(newProject);
      setCurrentProject(newProject);
      navigate(`/project/${newProject.id}`);
    } catch (error) {
      console.error("重置项目失败:", error);
    }
  };

  const handleTaskDetail = (task: PlanTask) => {
    setSelectedTaskForDetail(task);
    setIsTaskDetailDialogOpen(true);
  };

  return {
    isTaskDetailDialogOpen,
    setIsTaskDetailDialogOpen,
    selectedTaskForDetail,
    handleResetProject,
    handleTaskDetail,
  };
}
