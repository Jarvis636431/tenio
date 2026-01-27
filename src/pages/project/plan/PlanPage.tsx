import { useState, useMemo, useEffect } from "react";
import { useProject } from "@/hooks/useProject";
import { useProjectSchedule } from "@/hooks/useProjectSchedule";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import {
  PlanToolbar,
  PlanContent,
  PlanDialogs,
  usePlanFilters,
  usePlanPagination,
  usePlanExport,
  usePlanDialogs,
} from "@/pages/project/plan";
import { useParams } from "react-router-dom";
import type { TimelineScale } from "@/types/domain/plan";

export function PlanPage() {
  const { currentProject } = useProject();
  const { tab } = useParams();

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

  const {
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
    handleEditClick,
    handleSaveEdit,
    handleCancelEdit,
    handleGanttTaskDetail,
  } = usePlanDialogs();

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
        onGanttTaskDetail={(taskId) =>
          handleGanttTaskDetail(allData.find((item) => item.id === taskId))
        }
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
