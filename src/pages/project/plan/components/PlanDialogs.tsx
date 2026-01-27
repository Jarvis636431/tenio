import { NewTaskDialog } from "@/components/plan/dialogs/NewTaskDialog";
import { TaskDetailDialog } from "@/components/plan/dialogs/TaskDetailDialog";
import { TaskDetailSheet } from "@/components/plan/dialogs/TaskDetailSheet";
import type { PlanTask } from "@/types/domain/plan";

interface PlanDialogsProps {
  isDetailDialogOpen: boolean;
  setIsDetailDialogOpen: (open: boolean) => void;
  selectedItem: PlanTask | null;
  isEditMode: boolean;
  editedItem: PlanTask | null;
  onEditClick: (item: PlanTask) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditedItemChange: (item: PlanTask | null) => void;
  isNewTaskDialogOpen: boolean;
  setIsNewTaskDialogOpen: (open: boolean) => void;
  existingTasks: PlanTask[];
  projectId: string;
  onTaskAdded: (task: PlanTask) => void;
  isTaskDetailDialogOpen: boolean;
  setIsTaskDetailDialogOpen: (open: boolean) => void;
  selectedTaskForDetail: PlanTask | null;
}

export function PlanDialogs({
  isDetailDialogOpen,
  setIsDetailDialogOpen,
  selectedItem,
  isEditMode,
  editedItem,
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  onEditedItemChange,
  isNewTaskDialogOpen,
  setIsNewTaskDialogOpen,
  existingTasks,
  projectId,
  onTaskAdded,
  isTaskDetailDialogOpen,
  setIsTaskDetailDialogOpen,
  selectedTaskForDetail,
}: PlanDialogsProps) {
  return (
    <>
      <TaskDetailSheet
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        selectedItem={selectedItem}
        isEditMode={isEditMode}
        editedItem={editedItem}
        onEditClick={onEditClick}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        onEditedItemChange={onEditedItemChange}
      />

      <NewTaskDialog
        open={isNewTaskDialogOpen}
        onOpenChange={setIsNewTaskDialogOpen}
        onAdd={onTaskAdded}
        existingTasks={existingTasks}
        projectId={projectId}
      />

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
