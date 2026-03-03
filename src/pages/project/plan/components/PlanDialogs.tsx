import { TaskDetailDialog } from "@/components/plan/dialogs/TaskDetailDialog";
import type { PlanTask } from "@/types/domain/plan";

interface PlanDialogsProps {
  projectId: string;
  isTaskDetailDialogOpen: boolean;
  setIsTaskDetailDialogOpen: (open: boolean) => void;
  selectedTaskForDetail: PlanTask | null;
}

export function PlanDialogs({
  projectId,
  isTaskDetailDialogOpen,
  setIsTaskDetailDialogOpen,
  selectedTaskForDetail,
}: PlanDialogsProps) {
  return (
    <>
      <TaskDetailDialog
        open={isTaskDetailDialogOpen}
        onOpenChange={setIsTaskDetailDialogOpen}
        task={selectedTaskForDetail}
        projectId={projectId}
        workProcessName={selectedTaskForDetail?.task}
      />
    </>
  );
}
