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
  projectId: string;
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
  projectId,
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
