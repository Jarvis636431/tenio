import { useState } from "react";
import type { PlanTask } from "@/types/domain/plan";

export function usePlanDialogs() {
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<PlanTask | null>(null);

  const handleMoreClick = (item: PlanTask) => {
    setSelectedTaskForDetail(item);
    setIsTaskDetailDialogOpen(true);
  };

  const handleGanttTaskDetail = (taskItem: PlanTask | undefined) => {
    if (taskItem) {
      setSelectedTaskForDetail(taskItem);
      setIsTaskDetailDialogOpen(true);
    }
  };

  return {
    isTaskDetailDialogOpen,
    setIsTaskDetailDialogOpen,
    selectedTaskForDetail,
    handleMoreClick,
    handleGanttTaskDetail,
  };
}
