import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, Download, Calendar, Filter, Edit, Eye, BarChart3, Save, X, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProject } from "@/contexts/ProjectContext";
import { useProjectSchedule } from "@/hooks/useProjectSchedule";
import type { ProjectScheduleItem } from "@/hooks/useProjectSchedule";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import { GanttChart, type TimelineScale } from "@/components/GanttChart";
import { NewTaskDialog } from "@/components/NewTaskDialog";
import { TaskDetailDialog } from "@/components/TaskDetailDialog";
import { useSearchParams } from "react-router-dom";

interface PlanAndOrdersProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

// 扩展计划项类型以适配页面内使用的附加字段
type TaskItem = ProjectScheduleItem & {
  specialty?: string;
  component?: string;
  totalCost?: number;
  constructionSituation?: string;
  prerequisiteProcess?: string;
  quantity?: number;
  quantityUnit?: string;
  overtime?: string;
  duration?: string;
  actualWorkDays?: number;
  constructionMethod?: string;
  directDependency?: string;
  remarks?: string;
  selectedConstructionMethod?: string;
  materialCost?: number;
  laborCost?: number;
  floor?: number;
};

// 新增任务的表单数据类型，替代 any
interface NewTaskFormData {
  task: string;
  startTime: string;
  endTime: string;
  jobType?: string;
  workerCount?: number;
  prerequisiteTasks?: string[];
  dependentTasks?: string[];
  prerequisiteProcess?: string;
  directDependency?: string;
  remarks?: string;
}

const TIMELINE_SCALE_LABELS: Record<TimelineScale, string> = {
  day: "天",
  hour: "小时",
  week: "周",
  month: "月",
};

export function PlanAndOrders({ showExpandButton = false, onExpandSidebar }: PlanAndOrdersProps) {
  const { currentProject } = useProject();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedItem, setEditedItem] = useState<TaskItem | null>(null);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskItem | null>(null);
  const [timelineScale, setTimelineScale] = useState<TimelineScale>("day");
  
  // 根据URL参数确定显示的内容
  const activeView = searchParams.get('tab') || 'task-overview';

  const { scheduleItems, isLoading, error, refetch } = useProjectSchedule();
  const { config, refetch: refetchConfig } = useProjectConfig();
  const allData = scheduleItems;

  // 工种类型
  const jobTypes = useMemo(() => {
    const types = new Set(allData.map(item => item.jobType).filter(Boolean));
    return Array.from(types);
  }, [allData]);

  // 楼层类型 - 10层排在最后，但在跨楼层之前
  const floorTypes = useMemo(() => {
    const floors = new Set(allData.map(item => item.floor));
    const floorArray = Array.from(floors);
    
    // 分离普通楼层和特殊楼层
    const normalFloors = floorArray.filter(f => f > 0 && f < 10).sort((a, b) => a - b);
    const floor10 = floorArray.filter(f => f === 10);
    const crossFloors = floorArray.filter(f => f === 0 || f < 0); // 跨楼层或特殊楼层
    
    // 按顺序排列：普通楼层 -> 10层 -> 跨楼层
    return [...normalFloors, ...floor10, ...crossFloors];
  }, [allData]);

  // 过滤和排序数据
  const filteredData = useMemo(() => {
    return allData.filter(item => {
      const matchesSearch = item.task.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesJob = jobFilter === "all" || item.jobType === jobFilter;
      const matchesFloor = floorFilter === "all" || item.floor.toString() === floorFilter;
      return matchesSearch && matchesJob && matchesFloor;
    });
  }, [allData, searchTerm, jobFilter, floorFilter]);

  // 分页数据
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 工种颜色映射
  const getJobTypeColor = (jobType: string) => {
    const colors: { [key: string]: string } = {
      "钢筋工": "bg-category-blue-100 text-category-blue-800",
      "混凝土工": "bg-category-green-100 text-category-green-800",
      "木工": "bg-category-yellow-100 text-category-yellow-800",
      "测量员": "bg-category-purple-100 text-category-purple-800",
      "土方工": "bg-category-orange-100 text-category-orange-800",
      "砌筑工": "bg-pink-100 text-pink-800",
      "抹灰工": "bg-indigo-100 text-indigo-800",
      "防水工": "bg-cyan-100 text-cyan-800",
      "水电工": "bg-teal-100 text-teal-800",
      "油漆工": "bg-lime-100 text-lime-800",
      "油工": "bg-lime-100 text-lime-800",
      "瓦工": "bg-pink-100 text-pink-800",
      "不限": "bg-gray-100 text-gray-800"
    };
    return colors[jobType] || "bg-gray-100 text-gray-800";
  };

  // 详情对话框处理
  const handleDetailClick = (item: TaskItem) => {
    setSelectedItem(item);
    setIsEditMode(false); // 确保从详情入口进入时是只读状态
    setEditedItem(null);
    setIsDetailDialogOpen(true);
  };

  // 更多详情对话框处理
  const handleMoreClick = (item: TaskItem) => {
    setSelectedTaskForDetail(item);
    setIsTaskDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDialogOpen(false);
    setSelectedItem(null);
    setIsEditMode(false);
    setEditedItem(null);
  };

  const handleEditClick = (item: TaskItem) => {
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
      console.log('保存编辑:', editedItem);
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

  // 检测内容是否有变化
  const hasChanges = useMemo(() => {
    if (!isEditMode || !selectedItem || !editedItem) return false;
    
    // 比较所有字段是否有变化
    const fieldsToCompare: (keyof TaskItem)[] = [
      'task', 'specialty', 'component', 'workerCount', 'jobType', 'totalCost',
      'startTime', 'endTime', 'constructionSituation', 'prerequisiteProcess',
      'quantity', 'quantityUnit', 'overtime', 'duration', 'actualWorkDays',
      'constructionMethod', 'directDependency', 'remarks', 'selectedConstructionMethod',
      'materialCost', 'laborCost', 'floor'
    ];
    
    return fieldsToCompare.some(field => {
      const originalValue = selectedItem[field];
      const editedValue = editedItem[field];
      
      // 处理数字类型的比较
      if (typeof originalValue === 'number' && typeof editedValue === 'number') {
        return originalValue !== editedValue;
      }
      
      // 处理字符串类型的比较
      return String(originalValue || '') !== String(editedValue || '');
    });
  }, [isEditMode, selectedItem, editedItem]);

  // 新增任务处理函数
  const handleAddTask = (taskData: NewTaskFormData) => {
    const nextId =
      allData.length > 0 ? Math.max(...allData.map((item) => item.id)) + 1 : 1;

    const prerequisites = Array.isArray(taskData.prerequisiteTasks)
      ? taskData.prerequisiteTasks.join(', ')
      : String(taskData.prerequisiteProcess || '');
    const successors = Array.isArray(taskData.dependentTasks)
      ? taskData.dependentTasks.join(', ')
      : String(taskData.directDependency || '');

    const newTask: TaskItem = {
      id: nextId,
      task: taskData.task,
      specialty: "结构",
      component: "自定义",
      workerCount: taskData.workerCount,
      jobType: taskData.jobType,
      totalCost: 0,
      startTime: taskData.startTime,
      endTime: taskData.endTime,
      constructionSituation: "标准层施工",
      prerequisiteProcess: prerequisites,
      quantity: 0,
      quantityUnit: "个",
      overtime: "否",
      duration: "1天",
      actualWorkDays: 1,
      constructionMethod: "人工",
      directDependency: successors,
      remarks: taskData.remarks,
      selectedConstructionMethod: "人工",
      materialCost: 0,
      laborCost: 0,
      floor: 1
    };

    console.log('新增任务:', newTask);
    setIsNewTaskDialogOpen(false);
  };

  // CSV导出功能
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      console.warn("没有可导出的任务数据");
      return;
    }
    // 准备CSV数据
    const csvData = filteredData.map(item => ({
      '任务名称': item.task,
      '施工方式': item.constructionMethod,
      '工种': item.jobType || '',
      '施工人数': item.workerCount,
      '开始时间': item.startTime,
      '结束时间': item.endTime,
      '持续时长': item.duration,
      '实际工作天数': item.actualWorkDays,
      '是否加班': item.overtime,
      '施工情况': item.constructionSituation,
      '选定施工方式': item.selectedConstructionMethod,
      '前置工序': item.prerequisiteProcess || '',
      '直接依赖任务': item.directDependency,
      '层数': item.floor,
      '工程量': item.quantity,
      '工程量单位': item.quantityUnit,
      '材料价格': item.materialCost,
      '劳动力成本': item.laborCost,
      '总成本': item.totalCost,
      '备注': item.remarks || ''
    }));

    // 转换为CSV格式
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header];
          // 处理包含逗号、引号或换行符的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `施工任务清单_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 渲染字段的辅助函数
  const renderField = (label: string, value: string, field: keyof TaskItem) => {
    if (isEditMode && editedItem) {
      return (
        <div>
          <label className="text-sm font-medium text-muted-foreground">{label}</label>
          <Input
            value={String(editedItem[field] || '')}
            onChange={(e) => setEditedItem(prev => prev ? { ...prev, [field]: e.target.value } : null)}
            className="mt-1"
          />
        </div>
      );
    }
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <p className="text-sm">{value}</p>
      </div>
    );
  };

  // 甘特图数据转换 - 使用过滤后的数据
  const ganttData = useMemo(() => {
    return filteredData.map(item => ({
      id: item.id,
      task: item.task,
      startDate: item.startTime,
      endDate: item.endTime,
      duration: item.duration,
      worker: item.jobType,
      count: item.workerCount,
      floor: item.floor
    }));
  }, [filteredData]);

  // 重置分页当搜索条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, jobFilter, floorFilter, ]);

  useEffect(() => {
    const handleRefresh = () => {
      // 并行刷新视图与配置，确保数据同步更新
      refetch();
      refetchConfig();
    };
    window.addEventListener("plan:refresh-request", handleRefresh);
    return () => window.removeEventListener("plan:refresh-request", handleRefresh);
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
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索任务..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择工种" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部工种</SelectItem>
              {jobTypes.map(jobType => (
                <SelectItem key={jobType} value={jobType}>{jobType}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={floorFilter} onValueChange={setFloorFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择楼层" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部楼层</SelectItem>
              {floorTypes.map(floor => (
                <SelectItem key={floor} value={floor.toString()}>
                  {floor === 0 ? "基础层" : `${floor}层`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-4">
          {activeView === 'gantt-chart' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
                  <span>时间粒度：{TIMELINE_SCALE_LABELS[timelineScale]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {(Object.entries(TIMELINE_SCALE_LABELS) as [TimelineScale, string][]).map(([value, label]) => (
                  <DropdownMenuItem
                    key={value}
                    onSelect={() => setTimelineScale(value)}
                    className={timelineScale === value ? "bg-muted font-medium" : ""}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="text-sm text-muted-foreground">
            {activeView === 'gantt-chart' ? `显示 ${ganttData.length} 个任务` : `显示 ${filteredData.length} 个任务`}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
            <Button
              size="sm"
              onClick={() => currentProject?.id && setIsNewTaskDialogOpen(true)}
              disabled={!currentProject?.id}
            >
              <Plus className="h-4 w-4 mr-2" />
              新增任务
            </Button>
          </div>
        </div>
      </div>

      <div className="h-full flex flex-col">
        {/* 可滚动的内容区域 - 自适应高度 */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'task-overview' && (
            <div className="h-full flex flex-col space-y-6">
              {/* 数据表格 */}
              <div className="flex-1 flex flex-col">
                {/* 表格容器 - 带边框 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-[calc(100vh-350px)] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-30 shadow-sm">
                        <TableRow>
                          <TableHead className="w-[60px] bg-white">
                            序号
                          </TableHead>
                          <TableHead className="w-[234px] bg-white">
                            任务
                          </TableHead>
                          <TableHead className="w-[100px] bg-white">人数</TableHead>
                          <TableHead className="w-[120px] bg-white">工种</TableHead>
                          <TableHead className="w-[120px] bg-white">施工方式</TableHead>
                          <TableHead className="w-[120px] bg-white">开始时间</TableHead>
                          <TableHead className="w-[120px] bg-white">结束时间</TableHead>
                          <TableHead className="w-[216px] bg-white">
                            操作
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((item, index) => (
                          <TableRow key={item.id} className="border-b h-12">
                            <TableCell className="w-[60px] bg-white py-2 text-center text-gray-600">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </TableCell>
                            <TableCell className="sticky left-0 z-20 w-[234px] bg-white py-2">
                              <div className="text-sm">{item.task}</div>
                            </TableCell>
                            <TableCell className="w-[100px] bg-white py-2">{item.workerCount}</TableCell>
                            <TableCell className="w-[120px] bg-white py-2">
                              {item.jobType && (
                                <Badge variant="secondary" className={getJobTypeColor(item.jobType)}>
                                  {item.jobType}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="w-[120px] bg-white py-2">{item.constructionMethod || "--"}</TableCell>
                            <TableCell className="w-[120px] bg-white py-2">{item.startTime}</TableCell>
                            <TableCell className="w-[120px] bg-white py-2">{item.endTime}</TableCell>
                            <TableCell className="sticky right-0 z-20 w-[216px] bg-white py-2">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleEditClick(item)}>
                                  编辑
                                </Button>
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleDetailClick(item)}>
                                  详情
                                </Button>
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleMoreClick(item)}>
                                  更多
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* 分页控件 - 在边框外面 */}
                <div className="flex items-center justify-between p-4 mt-4">
                  <div className="text-sm text-muted-foreground">
                    显示 {((currentPage - 1) * itemsPerPage) + 1} 到 {Math.min(currentPage * itemsPerPage, filteredData.length)} 条，共 {filteredData.length} 条记录
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {currentPage} 页，共 {totalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'gantt-chart' && (
            <div className="h-[calc(100vh-200px)]">
              <GanttChart 
                data={ganttData} 
                scale={timelineScale}
                shutdownEvents={config?.shutdown_events ?? []}
                onTaskDetail={(task) => {
                  // 将甘特图的任务数据转换为表格数据格式
                  const taskItem = allData.find(item => item.id === task.id);
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
        </div>
      </div>

      {/* 详情抽屉 */}
      <Sheet open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] flex flex-col" showOverlay={false}>
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>
              {isEditMode ? '编辑任务' : '任务详情'} - {selectedItem?.task}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto flex-1 min-h-0">
          {selectedItem && (
            <div className="space-y-6 pb-20">
              {/* 施工时间 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">施工时间</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderField("开始时间", selectedItem.startTime, "startTime")}
                    {renderField("结束时间", selectedItem.endTime, "endTime")}
                    {renderField("持续时长", selectedItem.duration, "duration")}
                    {renderField("是否加班", selectedItem.overtime, "overtime")}
                    {renderField("施工情况", selectedItem.constructionSituation, "constructionSituation")}
                  </div>
                </CardContent>
              </Card>

              {/* 基础信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">基础信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderField("任务名称", selectedItem.task, "task")}
                    {renderField("施工方式", selectedItem.constructionMethod, "constructionMethod")}
                    {renderField("工种", selectedItem.jobType || "无", "jobType")}
                    {renderField("施工人数", String(selectedItem.workerCount), "workerCount")}
                    {renderField("层数", `${selectedItem.floor}层`, "floor")}
                    {renderField("选定施工方式", selectedItem.selectedConstructionMethod, "selectedConstructionMethod")}
                  </div>
                </CardContent>
              </Card>

              {/* 更多信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">更多信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderField("前置工序", selectedItem.prerequisiteProcess || "无", "prerequisiteProcess")}
                    {renderField("直接依赖任务", selectedItem.directDependency, "directDependency")}
                    <div className="col-span-2">
                      {renderField("备注", selectedItem.remarks || "无", "remarks")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
          
          {/* 固定在底部的操作按钮 */}
          {selectedItem && (
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end gap-2">
              {isEditMode ? (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-primary hover:text-primary hover:bg-primary/10"
                    onClick={handleCancelEdit}
                  >
                    取消
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-primary hover:text-primary hover:bg-primary/10"
                    onClick={handleSaveEdit}
                    disabled={!hasChanges}
                  >
                    保存
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  className="text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => handleEditClick(selectedItem)}
                >
                  编辑
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 新增任务对话框 */}
      <NewTaskDialog
        open={isNewTaskDialogOpen}
        onOpenChange={setIsNewTaskDialogOpen}
        onAdd={handleAddTask}
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
