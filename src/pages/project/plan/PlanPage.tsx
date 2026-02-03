import { useState, useMemo, useEffect } from "react";
import { useProject } from "@/hooks/useProject";
import { useProjectCoreGraph } from "@/hooks/useProjectCoreGraph";
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

  const { coreGraph, isLoading } = useProjectCoreGraph();
  const { config, refetch: refetchConfig } = useProjectConfig();
  const allData = useMemo(() => {
    if (!coreGraph?.work_processes?.length) return [];
    const depsByTarget = new Map<string, string[]>();
    coreGraph.dependencies?.forEach((dep) => {
      if (!dep?.to_work_process_id || !dep?.from_work_process_id) return;
      const list = depsByTarget.get(dep.to_work_process_id) ?? [];
      list.push(dep.from_work_process_id);
      depsByTarget.set(dep.to_work_process_id, list);
    });

    const resolvePlannedRange = (wp: typeof coreGraph.work_processes[number]) => {
      const exec = wp.execution_state;
      if (!exec) return { start: "", end: "" };
      const start = exec.planned_start_datetime ?? "";
      const end = exec.planned_end_datetime ?? "";
      if (start && end) return { start, end };
      const intervals = exec.planned_intervals ?? [];
      if (intervals.length === 0) return { start, end };
      const starts = intervals.map((i) => new Date(i.start_datetime).getTime()).filter((v) => !Number.isNaN(v));
      const ends = intervals.map((i) => new Date(i.end_datetime).getTime()).filter((v) => !Number.isNaN(v));
      if (!starts.length || !ends.length) return { start, end };
      return {
        start: new Date(Math.min(...starts)).toISOString(),
        end: new Date(Math.max(...ends)).toISOString(),
      };
    };

    return coreGraph.work_processes.map((wp) => {
      const exec = wp.execution_state;
      const { start, end } = resolvePlannedRange(wp);
      const deps = depsByTarget.get(wp.id) ?? [];
      return {
        id: wp.id,
        task: wp.name || wp.code || "未命名工序",
        workerCount: wp.team_size ?? wp.suggested_team_count ?? 0,
        jobType: wp.trade?.name ?? "",
        totalCost:
          (wp.labor_cost ?? 0) +
          (wp.material_cost ?? 0) +
          (wp.device_rental_cost ?? 0),
        startTime: start,
        endTime: end,
        constructionSituation: exec?.status ?? "",
        prerequisiteProcess: deps.join(", "),
        quantity: wp.quantity ?? 0,
        quantityUnit: wp.unit ?? "",
        overtime: "否",
        duration: wp.duration_days ? `${wp.duration_days}天` : "",
        actualWorkDays: wp.duration_days ?? 0,
        constructionMethod: wp.selected_method?.name ?? "",
        directDependency: "",
        remarks: "",
        selectedConstructionMethod: wp.selected_method?.name ?? "",
        materialCost: wp.material_cost ?? 0,
        laborCost: wp.labor_cost ?? 0,
        floor: 0,
        criticalPath: exec?.critical_path ?? false,
      };
    });
  }, [coreGraph]);

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
      refetchConfig();
    };
    window.addEventListener("plan:refresh-request", handleRefresh);
    return () =>
      window.removeEventListener("plan:refresh-request", handleRefresh);
  }, [refetchConfig]);

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
