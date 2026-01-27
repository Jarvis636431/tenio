import { useState, useMemo, useEffect } from "react";
import { useProject } from "@/hooks/useProject";
import { useProjectSchedule } from "@/hooks/useProjectSchedule";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import { PlanToolbar } from "@/pages/project/plan/components/PlanToolbar";
import { PlanContent } from "@/pages/project/plan/components/PlanContent";
import { PlanDialogs } from "@/pages/project/plan/components/PlanDialogs";
import { useParams } from "react-router-dom";
import type { PlanTask, TimelineScale } from "@/types/domain/plan";
import { usePlanFilters } from "@/pages/project/plan/hooks/usePlanFilters";
import { usePlanPagination } from "@/pages/project/plan/hooks/usePlanPagination";
import { usePlanExport } from "@/pages/project/plan/hooks/usePlanExport";

export function PlanAndOrders() {
  const { currentProject } = useProject();
  const { tab } = useParams();

  // State declarations
  const [selectedItem, setSelectedItem] = useState<PlanTask | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedItem, setEditedItem] = useState<PlanTask | null>(null);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<PlanTask | null>(null);
  const [timelineScale, setTimelineScale] = useState<TimelineScale>("day");

  const { scheduleItems, isLoading, error, refetch } = useProjectSchedule();
  const { config, refetch: refetchConfig } = useProjectConfig();
  const allData = scheduleItems;

  const {
    searchTerm,
    setSearchTerm,
    jobFilter,
    setJobFilter,
    floorFilter,
    setFloorFilter,
    jobTypes,
    floorTypes,
    filteredData,
  } = usePlanFilters(allData);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    itemsPerPage,
  } = usePlanPagination(filteredData);

  const { handleExportCSV } = usePlanExport(filteredData);

  // 详情对话框处理
  const handleDetailClick = (item: PlanTask) => {
    setSelectedItem(item);
    setIsEditMode(false); // 确保从详情入口进入时是只读状态
    setEditedItem(null);
    setIsDetailDialogOpen(true);
  };

  // 更多详情对话框处理
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
    // 如果详情页已经打开，不需要重新打开
    if (!isDetailDialogOpen) {
      setIsDetailDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedItem) {
      // 这里可以添加保存逻辑，比如更新数据
      console.log("保存编辑:", editedItem);
      // 更新原始数据
      setSelectedItem(editedItem);
      // 退出编辑模式
      setIsEditMode(false);
      setEditedItem(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedItem(null);
  };

  const handleGanttTaskDetail = (taskId: number) => {
    const taskItem = allData.find((item) => item.id === taskId);
    if (taskItem) {
      setSelectedItem(taskItem);
      setIsEditMode(false);
      setEditedItem(null);
      setIsDetailDialogOpen(true);
    }
  };

  // 甘特图数据转换 - 使用过滤后的数据
  const ganttData = useMemo(() => {
    return filteredData.map((item) => ({
      ...item,
      startDate: item.startTime,
      endDate: item.endTime,
      worker: item.jobType,
      count: item.workerCount,
    }));
  }, [filteredData]);

  useEffect(() => {
    const handleRefresh = () => {
      // 并行刷新视图与配置，确保数据同步更新
      refetch();
      refetchConfig();
    };
    window.addEventListener("plan:refresh-request", handleRefresh);
    return () =>
      window.removeEventListener("plan:refresh-request", handleRefresh);
  }, [refetch, refetchConfig]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-category-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载施工任务数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        数据加载失败：{error.message}
      </div>
    );
  }

  if (allData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        当前项目暂无施工任务数据
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <PlanToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        jobFilter={jobFilter}
        onJobFilterChange={setJobFilter}
        floorFilter={floorFilter}
        onFloorFilterChange={setFloorFilter}
        jobTypes={jobTypes}
        floorTypes={floorTypes}
        activeView={tab || "overview"}
        timelineScale={timelineScale}
        onTimelineScaleChange={setTimelineScale}
        filteredDataLength={filteredData.length}
        ganttDataLength={ganttData.length}
        onExportCSV={handleExportCSV}
        onNewTask={() => currentProject?.id && setIsNewTaskDialogOpen(true)}
        currentProjectId={currentProject?.id}
      />

      <PlanContent
        tab={tab}
        paginatedData={paginatedData}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        filteredDataLength={filteredData.length}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onEditClick={handleEditClick}
        onDetailClick={handleDetailClick}
        onMoreClick={handleMoreClick}
        ganttData={ganttData}
        timelineScale={timelineScale}
        shutdownEvents={config?.shutdown_events ?? []}
        onGanttTaskDetail={handleGanttTaskDetail}
      />

      <PlanDialogs
        isDetailDialogOpen={isDetailDialogOpen}
        setIsDetailDialogOpen={setIsDetailDialogOpen}
        selectedItem={selectedItem}
        isEditMode={isEditMode}
        editedItem={editedItem}
        onEditClick={handleEditClick}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onEditedItemChange={setEditedItem}
        isNewTaskDialogOpen={isNewTaskDialogOpen}
        setIsNewTaskDialogOpen={setIsNewTaskDialogOpen}
        existingTasks={allData}
        projectId={currentProject?.id ?? ""}
        onTaskAdded={(task) => {
          console.log("新增任务:", task);
          setIsNewTaskDialogOpen(false);
        }}
        isTaskDetailDialogOpen={isTaskDetailDialogOpen}
        setIsTaskDetailDialogOpen={setIsTaskDetailDialogOpen}
        selectedTaskForDetail={selectedTaskForDetail}
      />
    </div>
  );
}
