import { useMemo, useState } from "react";
import { Calendar, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GanttChart } from "@/components/GanttChart";
import { useProjectSchedule, ProjectScheduleItem } from "@/hooks/useProjectSchedule";

interface PlanOverviewProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

interface ScheduleData {
  id: number;
  task: string;
  startDate: string;
  endDate: string;
  duration: string;
  worker: string;
  count: number;
  totalCost: number;
  costDetails: {
    materialCost: number;
    laborCost: number;
    equipmentCost: number;
    materialDesc: string;
    laborDesc: string;
    equipmentDesc: string;
  };
}

const getWorkerBadgeColor = (worker: string) => {
  const colors: Record<string, string> = {
    "木工": "bg-category-blue-100 text-category-blue-800",
    "混凝土工": "bg-category-orange-100 text-category-orange-800",
    "砌筑工": "bg-category-green-100 text-category-green-800",
    "抹灰工": "bg-category-purple-100 text-category-purple-800",
    "安装工": "bg-pink-100 text-pink-800",
  };
  return colors[worker] || "bg-gray-100 text-gray-800";
};

const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;

export function PlanOverview({ showExpandButton = false, onExpandSidebar }: PlanOverviewProps) {
  const { scheduleItems, isLoading, error } = useProjectSchedule();

  const scheduleData = useMemo<ScheduleData[]>(() => {
    return scheduleItems.map((item: ProjectScheduleItem) => {
      const materialCost = item.materialCost || 0;
      const laborCost = item.laborCost || 0;
      const totalCost = item.totalCost || 0;
      const equipmentCost = Math.max(0, totalCost - materialCost - laborCost);

      return {
        id: item.id,
        task: item.task || `任务${item.id}`,
        startDate: item.startTime || "",
        endDate: item.endTime || "",
        duration: item.duration || "",
        worker: item.jobType || "其他",
        count: item.workerCount || 0,
        totalCost,
        costDetails: {
          materialCost,
          laborCost,
          equipmentCost,
          materialDesc: "材料费用",
          laborDesc: "劳务费用",
          equipmentDesc: "设备/其他费用",
        },
      };
    });
  }, [scheduleItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-category-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2 text-muted-foreground">
          <p>无法获取项目施工数据</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (scheduleData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        当前项目暂无施工计划数据
      </div>
    );
  }

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ScheduleData | null>(null);

  const handleViewDetails = (task: ScheduleData) => {
    setSelectedTask(task);
    setIsSheetOpen(true);
  };

  return <div className="h-full flex flex-col p-6">
      <Tabs defaultValue="schedule" className="h-full flex flex-col">
        {/* 固定在顶部的部分 */}
        <div className="shrink-0 space-y-6">

          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              总进度规划表
            </TabsTrigger>
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              施工工序甘特图
            </TabsTrigger>
          </TabsList>
        </div>
      
        {/* 可滚动的内容区域 - 自适应高度 */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="schedule" className="h-full m-0 py-4">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="bg-muted/60">
                        <TableHead className="w-[180px]">任务名称</TableHead>
                        <TableHead className="w-[100px]">开始日期</TableHead>
                        <TableHead className="w-[100px]">结束日期</TableHead>
                        <TableHead className="w-[80px]">持续</TableHead>
                        <TableHead className="w-[100px]">工种</TableHead>
                        <TableHead className="w-[60px]">人数</TableHead>
                        <TableHead className="w-[100px] text-right">费用</TableHead>
                        <TableHead className="w-[120px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduleData.map(item => <TableRow key={item.id}>
                          <TableCell className="font-medium w-[180px]">{item.task}</TableCell>
                          <TableCell className="w-[100px]">{item.startDate}</TableCell>
                          <TableCell className="w-[100px]">{item.endDate}</TableCell>
                          <TableCell className="w-[80px]">{item.duration}</TableCell>
                          <TableCell className="w-[100px]">
                            <Badge className={getWorkerBadgeColor(item.worker)}>
                              {item.worker}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-[60px]">{item.count}</TableCell>
                          <TableCell className="w-[100px] text-right font-medium">
                            {formatCurrency(item.totalCost)}
                          </TableCell>
                          <TableCell className="w-[120px]">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                编辑
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(item)}>
                                详情
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gantt" className="h-full m-0 py-4">
            <div className="h-full">
              <GanttChart data={scheduleData} />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* 详情抽屉 - 移除遮罩层 */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[90vw] max-w-none overflow-y-auto" showOverlay={false}>
          {selectedTask && <>
              <SheetHeader>
                <SheetTitle className="text-lg">{selectedTask.task} - 详细信息</SheetTitle>
                <SheetDescription>
                  总费用：{formatCurrency(selectedTask.totalCost)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* 基本信息单列展示 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">任务基本信息</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium w-32">任务名称</TableCell>
                          <TableCell>{selectedTask.task}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">开始日期</TableCell>
                          <TableCell>{selectedTask.startDate}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">结束日期</TableCell>
                          <TableCell>{selectedTask.endDate}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">持续天数</TableCell>
                          <TableCell>{selectedTask.duration}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">工种</TableCell>
                          <TableCell>
                            <Badge className={getWorkerBadgeColor(selectedTask.worker)}>
                              {selectedTask.worker}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">人数</TableCell>
                          <TableCell>{selectedTask.count}人</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* 费用明细表格 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">费用明细</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>费用类型</TableHead>
                          <TableHead className="text-right">金额</TableHead>
                          <TableHead>说明</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">材料费用</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(selectedTask.costDetails.materialCost)}
                          </TableCell>
                          <TableCell>{selectedTask.costDetails.materialDesc}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">人工费用</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(selectedTask.costDetails.laborCost)}
                          </TableCell>
                          <TableCell>{selectedTask.costDetails.laborDesc}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">设备费用</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(selectedTask.costDetails.equipmentCost)}
                          </TableCell>
                          <TableCell>{selectedTask.costDetails.equipmentDesc}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-semibold">总计</TableCell>
                          <TableCell className="text-right font-bold text-lg">
                            {formatCurrency(selectedTask.totalCost)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </>}
        </SheetContent>
      </Sheet>
    </div>;
}
