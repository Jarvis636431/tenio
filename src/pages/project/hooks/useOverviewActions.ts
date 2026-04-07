import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { initAgent } from "@/services/ai-service";
import {
  createProjectWithDefaultSolution,
  DEFAULT_SOLUTION_ID,
} from "@/services/project-bootstrap";
import type { DailyProcessItem } from "@/pages/project/hooks/useDailyProcesses";
import type { PlanTask } from "@/types/domain/plan";
import type { Project } from "@/types/domain/project";

type TimeRange = {
  baseDate: Date;
};

interface UseOverviewActionsOptions {
  resolvedProjectId: string;
  timeRange: TimeRange | null;
  planTasks: PlanTask[];
  addProject: (project: Project) => void;
  setCurrentProject: (project: Project | null) => void;
}

interface UseOverviewActionsResult {
  isTaskDetailDialogOpen: boolean;
  setIsTaskDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTaskForDetail: PlanTask | null;
  handleResetProject: () => Promise<void>;
  handleTaskDetail: (task: PlanTask) => void;
  handleDailyProcessClick: (item: DailyProcessItem) => void;
}

export function useOverviewActions({
  resolvedProjectId,
  timeRange,
  planTasks,
  addProject,
  setCurrentProject,
}: UseOverviewActionsOptions): UseOverviewActionsResult {
  const navigate = useNavigate();
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<PlanTask | null>(null);
  const agentInitKeyRef = useRef<string | null>(null);

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

  const handleDailyProcessClick = (item: DailyProcessItem) => {
    const matchedTask =
      planTasks.find((task) => task.id === item.id) ??
      planTasks.find((task) => task.task === item.name);
    if (!matchedTask) return;
    handleTaskDetail(matchedTask);
  };

  const agentBaseDate = useMemo(() => {
    if (!timeRange?.baseDate) return "";
    const y = timeRange.baseDate.getFullYear();
    const m = String(timeRange.baseDate.getMonth() + 1).padStart(2, "0");
    const d = String(timeRange.baseDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [timeRange]);

  useEffect(() => {
    if (!resolvedProjectId || !agentBaseDate) return;
    const key = `${resolvedProjectId}:${agentBaseDate}`;
    if (agentInitKeyRef.current === key) return;
    agentInitKeyRef.current = key;

    void initAgent({
      project_id: resolvedProjectId,
      base_date: agentBaseDate,
      solution_id: DEFAULT_SOLUTION_ID,
    }).catch(() => {
      agentInitKeyRef.current = null;
    });
  }, [resolvedProjectId, agentBaseDate]);

  return {
    isTaskDetailDialogOpen,
    setIsTaskDetailDialogOpen,
    selectedTaskForDetail,
    handleResetProject,
    handleTaskDetail,
    handleDailyProcessClick,
  };
}
