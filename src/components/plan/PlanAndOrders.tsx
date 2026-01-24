import { useState, useMemo, useEffect } from "react";
import { useProject } from "@/hooks/useProject";
import { useProjectSchedule } from "@/hooks/useProjectSchedule";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import { GanttChart } from "@/components/plan/GanttChart";
import { NewTaskDialog } from "@/components/plan/NewTaskDialog";
import { TaskDetailDialog } from "@/components/plan/TaskDetailDialog";
import { TaskFilters } from "@/components/plan/TaskFilters";
import { TaskActions } from "@/components/plan/TaskActions";
import { TaskOverview } from "@/components/plan/TaskOverview";
import { TaskDetailSheet } from "@/components/plan/TaskDetailSheet";
import { useLocation, useParams } from "react-router-dom";
import type { PlanTask, TimelineScale } from "@/types/domain/plan";

const TIMELINE_SCALE_LABELS: Record<TimelineScale, string> = {
  day: "天",
  hour: "小时",
  week: "周",
  month: "月",
};

// 中文数字映射表（共享）
const CHINESE_NUMBER_MAP: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

/**
 * 从楼层文本中提取数字
 * 支持：负一层、负1层、1层、地下1层等格式
 */
function extractFloorNumber(floor: string): number {
  if (floor.includes("负")) {
    // 处理中文数字：负一层、负二层等
    const chineseNum = floor.match(/负([一二三四五六七八九十]+)/)?.[1];
    if (chineseNum) {
      return -(CHINESE_NUMBER_MAP[chineseNum] || 1);
    }
    // 处理阿拉伯数字：负1层、负2层等
    const arabicNum = floor.match(/负(\d+)/)?.[1];
    if (arabicNum) {
      return -parseInt(arabicNum);
    }
  }
  // 普通楼层或地下楼层
  return parseInt(floor.match(/\d+/)?.[0] || "0");
}

import { NetworkDiagram } from "@/components/plan/NetworkDiagram";

export function PlanAndOrders() {
  const { currentProject } = useProject();
  const location = useLocation();
  const { tab } = useParams();

  // State declarations
  const [searchTerm, setSearchTerm] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
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

  // 工种类型
  const jobTypes = useMemo(() => {
    const types = new Set(allData.map((item) => item.jobType).filter(Boolean));
    return Array.from(types);
  }, [allData]);

  // 楼层类型 - 从工序名称中提取楼层信息
  const floorTypes = useMemo(() => {
    const floorSet = new Set<string>();
    let hasOthers = false; // 标记是否有无法匹配的工序

    // 遍历所有任务，从名称中提取楼层信息
    allData.forEach((item) => {
      // 匹配常见的楼层格式："1层"、"1F"、"11层"、"基础层"、"首层"、"地下1层"、"负一层"、"负二层" 等
      const floorMatches = item.task.match(
        /(?:地下|负[一二三四五六七八九十]*)?(\d+)(?:层|F|楼)|负[一二三四五六七八九十]+层|基础层|首层|屋面层|顶层/gi,
      );
      if (floorMatches) {
        floorMatches.forEach((match) => {
          floorSet.add(match);
        });
      } else {
        // 如果没有匹配到楼层信息，标记为有"其他"分类
        hasOthers = true;
      }
    });

    const floors = Array.from(floorSet);

    // 排序：地下楼层 → 首层 → 数字楼层 → 其他特殊楼层
    const sortedFloors = floors.sort((a, b) => {
      const numA = extractFloorNumber(a);
      const numB = extractFloorNumber(b);

      // 地下楼层（包括负数楼层）排在最前面
      const isUndergroundA = a.includes("地下") || a.includes("负");
      const isUndergroundB = b.includes("地下") || b.includes("负");

      if (isUndergroundA && !isUndergroundB) return -1;
      if (!isUndergroundA && isUndergroundB) return 1;

      // 如果都是地下楼层，按数字排序
      if (isUndergroundA && isUndergroundB) {
        const floorNumA = extractFloorNumber(a);
        const floorNumB = extractFloorNumber(b);
        return floorNumA - floorNumB;
      }

      // 首层排在地下楼层之后，数字楼层之前
      const isFirstFloorA = a.includes("首层");
      const isFirstFloorB = b.includes("首层");

      if (isFirstFloorA && !isFirstFloorB && !isUndergroundB) return -1;
      if (!isFirstFloorA && isFirstFloorB && !isUndergroundA) return 1;

      // 基础层和屋面层等特殊楼层排在后面
      const isOtherSpecialA =
        a.includes("基础") || a.includes("屋面") || a.includes("顶层");
      const isOtherSpecialB =
        b.includes("基础") || b.includes("屋面") || b.includes("顶层");

      if (isOtherSpecialA && !isOtherSpecialB) return 1;
      if (!isOtherSpecialA && isOtherSpecialB) return -1;

      // 如果都是特殊楼层，按字母排序
      if (isOtherSpecialA && isOtherSpecialB) {
        return a.localeCompare(b);
      }

      // 普通数字楼层按数字排序
      return numA - numB;
    });

    // 如果有无法匹配的工序，在最后添加"其他"选项
    if (hasOthers) {
      sortedFloors.push("其他");
    }

    return sortedFloors;
  }, [allData]);

  // 过滤和排序数据
  const filteredData = useMemo(() => {
    return allData.filter((item) => {
      const matchesSearch = item.task
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesJob = jobFilter === "all" || item.jobType === jobFilter;

      // 楼层筛选：检查任务名称中是否包含选中的楼层文本
      let matchesFloor = false;
      if (floorFilter === "all") {
        matchesFloor = true;
      } else if (floorFilter === "其他") {
        // 如果选择"其他"，显示所有没有匹配到楼层信息的工序
        const hasFloorInfo =
          /(?:地下|负[一二三四五六七八九十]*)?(\d+)(?:层|F|楼)|负[一二三四五六七八九十]+层|基础层|首层|屋面层|顶层/gi.test(
            item.task,
          );
        matchesFloor = !hasFloorInfo;
      } else {
        // 普通楼层筛选
        matchesFloor = item.task.includes(floorFilter);
      }

      return matchesSearch && matchesJob && matchesFloor;
    });
  }, [allData, searchTerm, jobFilter, floorFilter]);

  // 分页数据
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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

  // CSV导出功能
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      console.warn("没有可导出的任务数据");
      return;
    }
    // 准备CSV数据
    const csvData = filteredData.map((item) => ({
      任务名称: item.task,
      施工方式: item.constructionMethod,
      工种: item.jobType || "",
      施工人数: item.workerCount,
      开始时间: item.startTime,
      结束时间: item.endTime,
      持续时长: item.duration,
      实际工作天数: item.actualWorkDays,
      是否加班: item.overtime,
      施工情况: item.constructionSituation,
      选定施工方式: item.selectedConstructionMethod,
      前置工序: item.prerequisiteProcess || "",
      直接依赖任务: item.directDependency,
      层数: item.floor,
      工程量: item.quantity,
      工程量单位: item.quantityUnit,
      材料价格: item.materialCost,
      劳动力成本: item.laborCost,
      总成本: item.totalCost,
      备注: item.remarks || "",
    }));

    // 转换为CSV格式
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // 处理包含逗号、引号或换行符的值
            if (
              typeof value === "string" &&
              (value.includes(",") ||
                value.includes('"') ||
                value.includes("\n"))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    // 创建并下载文件
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `施工任务清单_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // 重置分页当搜索条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, jobFilter, floorFilter]);

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
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <TaskFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          jobFilter={jobFilter}
          onJobFilterChange={setJobFilter}
          floorFilter={floorFilter}
          onFloorFilterChange={setFloorFilter}
          jobTypes={jobTypes}
          floorTypes={floorTypes}
        />
        <TaskActions
          activeView={tab || "overview"}
          timelineScale={timelineScale}
          onTimelineScaleChange={setTimelineScale}
          filteredDataLength={filteredData.length}
          ganttDataLength={ganttData.length}
          onExportCSV={handleExportCSV}
          onNewTask={() => currentProject?.id && setIsNewTaskDialogOpen(true)}
          currentProjectId={currentProject?.id}
        />
      </div>

      <div className="h-full flex flex-col">
        {/* 可滚动的内容区域 - 自适应高度 */}
        <div className="flex-1 overflow-hidden">
          {(tab === "overview" || !tab) && (
            <TaskOverview
              paginatedData={paginatedData}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              filteredDataLength={filteredData.length}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onEditClick={handleEditClick}
              onDetailClick={handleDetailClick}
              onMoreClick={handleMoreClick}
            />
          )}

          {tab === "gantt" && (
            <div className="h-[calc(100vh-200px)]">
              <GanttChart
                data={ganttData}
                scale={timelineScale}
                shutdownEvents={config?.shutdown_events ?? []}
                onTaskDetail={(task) => {
                  // 将甘特图的任务数据转换为表格数据格式
                  const taskItem = allData.find((item) => item.id === task.id);
                  if (taskItem) {
                    setSelectedItem(taskItem);
                    setIsEditMode(false); // 确保从甘特图进入时是只读状态
                    setEditedItem(null);
                    setIsDetailDialogOpen(true);
                  }
                }}
              />
            </div>
          )}

          {tab === "network" && <NetworkDiagram tasks={ganttData} />}
        </div>
      </div>

      {/* 详情抽屉 */}
      <TaskDetailSheet
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        selectedItem={selectedItem}
        isEditMode={isEditMode}
        editedItem={editedItem}
        onEditClick={handleEditClick}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onEditedItemChange={setEditedItem}
      />

      {/* 新增任务对话框 */}
      <NewTaskDialog
        open={isNewTaskDialogOpen}
        onOpenChange={setIsNewTaskDialogOpen}
        onAdd={(task) => {
          console.log("新增任务:", task);
          setIsNewTaskDialogOpen(false);
        }}
        existingTasks={allData}
        projectId={currentProject?.id ?? ""}
      />

      {/* 任务详情对话框 */}
      <TaskDetailDialog
        open={isTaskDetailDialogOpen}
        onOpenChange={setIsTaskDetailDialogOpen}
        task={selectedTaskForDetail}
        projectId={currentProject?.id}
        workProcessName={selectedTaskForDetail?.task}
      />
    </div>
  );
}
