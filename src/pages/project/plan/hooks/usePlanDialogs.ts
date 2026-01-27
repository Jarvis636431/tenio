import { useState } from "react";
import type { PlanTask } from "@/types/domain/plan";

export function usePlanDialogs() {
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PlanTask | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedItem, setEditedItem] = useState<PlanTask | null>(null);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<PlanTask | null>(null);

  const handleDetailClick = (item: PlanTask) => {
    setSelectedItem(item);
    setIsEditMode(false);
    setEditedItem(null);
    setIsDetailDialogOpen(true);
  };

  const handleMoreClick = (item: PlanTask) => {
    setSelectedTaskForDetail(item);
    setIsTaskDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDialogOpen(false);
    setSelectedItem(null);
    setIsEditMode(false);
    setEditedItem(null);
  };

  const handleEditClick = (item: PlanTask) => {
    setSelectedItem(item);
    setEditedItem({ ...item });
    setIsEditMode(true);
    if (!isDetailDialogOpen) {
      setIsDetailDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedItem) {
      console.log("保存编辑:", editedItem);
      setSelectedItem(editedItem);
      setIsEditMode(false);
      setEditedItem(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedItem(null);
  };

  const handleGanttTaskDetail = (taskItem: PlanTask | undefined) => {
    if (taskItem) {
      setSelectedItem(taskItem);
      setIsEditMode(false);
      setEditedItem(null);
      setIsDetailDialogOpen(true);
    }
  };

  return {
    isDetailDialogOpen,
    setIsDetailDialogOpen,
    selectedItem,
    isEditMode,
    editedItem,
    isNewTaskDialogOpen,
    setIsNewTaskDialogOpen,
    isTaskDetailDialogOpen,
    setIsTaskDetailDialogOpen,
    selectedTaskForDetail,
    setEditedItem,
    handleDetailClick,
    handleMoreClick,
    handleCloseDetail,
    handleEditClick,
    handleSaveEdit,
    handleCancelEdit,
    handleGanttTaskDetail,
  };
}
