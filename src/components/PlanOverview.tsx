
import { useState } from "react";
import { Calendar, BarChart3, DollarSign, Package, Users, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GanttChart } from "@/components/GanttChart";

// 扩展的进度数据，包含费用信息
const scheduleData = [{
  id: 1,
  task: "地面支模",
  startDate: "8月1日",
  endDate: "8月1日",
  duration: "1天",
  worker: "木工",
  count: 2,
  totalCost: 8000,
  costDetails: {
    materialCost: 5000,
    laborCost: 2000,
    equipmentCost: 1000,
    materialDesc: "模板及配件租赁",
    laborDesc: "木工工资及补贴",
    equipmentDesc: "支撑工具租赁"
  }
}, {
  id: 2,
  task: "地面混凝土浇筑",
  startDate: "8月2日",
  endDate: "8月4日",
  duration: "3天",
  worker: "混凝土工",
  count: 4,
  totalCost: 15000,
  costDetails: {
    materialCost: 10000,
    laborCost: 3000,
    equipmentCost: 2000,
    materialDesc: "商品混凝土采购",
    laborDesc: "混凝土工工资",
    equipmentDesc: "搅拌车及泵车租赁"
  }
}, {
  id: 3,
  task: "地面拆模",
  startDate: "8月5日",
  endDate: "8月5日",
  duration: "1天",
  worker: "木工",
  count: 3,
  totalCost: 3000,
  costDetails: {
    materialCost: 500,
    laborCost: 2000,
    equipmentCost: 500,
    materialDesc: "拆模辅材消耗",
    laborDesc: "木工拆模工资",
    equipmentDesc: "拆模工具使用"
  }
}, {
  id: 4,
  task: "柱支模",
  startDate: "8月5日",
  endDate: "8月5日",
  duration: "1天",
  worker: "木工",
  count: 2,
  totalCost: 6000,
  costDetails: {
    materialCost: 4000,
    laborCost: 1500,
    equipmentCost: 500,
    materialDesc: "柱模板系统租赁",
    laborDesc: "木工支模工资",
    equipmentDesc: "支撑架具租赁"
  }
}, {
  id: 5,
  task: "柱混凝土浇筑",
  startDate: "8月6日",
  endDate: "8月6日",
  duration: "1天",
  worker: "混凝土工",
  count: 2,
  totalCost: 8000,
  costDetails: {
    materialCost: 5500,
    laborCost: 1500,
    equipmentCost: 1000,
    materialDesc: "高强度混凝土采购",
    laborDesc: "混凝土工浇筑工资",
    equipmentDesc: "小型泵车租赁"
  }
}, {
  id: 6,
  task: "柱拆模",
  startDate: "8月7日",
  endDate: "8月7日",
  duration: "1天",
  worker: "木工",
  count: 2,
  totalCost: 2500,
  costDetails: {
    materialCost: 300,
    laborCost: 1500,
    equipmentCost: 700,
    materialDesc: "拆模材料损耗",
    laborDesc: "木工拆模工资",
    equipmentDesc: "拆模设备使用"
  }
}, {
  id: 7,
  task: "承重墙支模",
  startDate: "8月6日",
  endDate: "8月6日",
  duration: "1天",
  worker: "木工",
  count: 4,
  totalCost: 12000,
  costDetails: {
    materialCost: 8000,
    laborCost: 3000,
    equipmentCost: 1000,
    materialDesc: "大型墙体模板租赁",
    laborDesc: "木工团队工资",
    equipmentDesc: "支撑系统租赁"
  }
}, {
  id: 8,
  task: "承重墙混凝土浇筑",
  startDate: "8月7日",
  endDate: "8月9日",
  duration: "3天",
  worker: "混凝土工",
  count: 4,
  totalCost: 25000,
  costDetails: {
    materialCost: 18000,
    laborCost: 4000,
    equipmentCost: 3000,
    materialDesc: "大量商品混凝土采购",
    laborDesc: "混凝土工团队工资",
    equipmentDesc: "大型泵车租赁"
  }
}, {
  id: 9,
  task: "承重墙拆模",
  startDate: "8月10日",
  endDate: "8月10日",
  duration: "1天",
  worker: "木工",
  count: 4,
  totalCost: 5000,
  costDetails: {
    materialCost: 800,
    laborCost: 3000,
    equipmentCost: 1200,
    materialDesc: "拆模辅助材料",
    laborDesc: "木工团队拆模工资",
    equipmentDesc: "拆模机械设备"
  }
}, {
  id: 10,
  task: "砌体隔墙",
  startDate: "8月11日",
  endDate: "8月12日",
  duration: "2天",
  worker: "砌筑工",
  count: 4,
  totalCost: 18000,
  costDetails: {
    materialCost: 12000,
    laborCost: 4000,
    equipmentCost: 2000,
    materialDesc: "砖块及砂浆采购",
    laborDesc: "砌筑工工资",
    equipmentDesc: "砌筑工具及脚手架"
  }
}, {
  id: 11,
  task: "抹灰",
  startDate: "8月13日",
  endDate: "8月17日",
  duration: "5天",
  worker: "抹灰工",
  count: 2,
  totalCost: 12000,
  costDetails: {
    materialCost: 6000,
    laborCost: 5000,
    equipmentCost: 1000,
    materialDesc: "水泥砂浆及腻子",
    laborDesc: "抹灰工工资",
    equipmentDesc: "抹灰工具租赁"
  }
}, {
  id: 12,
  task: "门窗安装",
  startDate: "8月13日",
  endDate: "8月13日",
  duration: "1天",
  worker: "安装工",
  count: 2,
  totalCost: 35000,
  costDetails: {
    materialCost: 30000,
    laborCost: 3000,
    equipmentCost: 2000,
    materialDesc: "门窗产品采购",
    laborDesc: "安装工工资",
    equipmentDesc: "安装工具及设备"
  }
}, {
  id: 13,
  task: "屋面支模",
  startDate: "8月14日",
  endDate: "8月14日",
  duration: "1天",
  worker: "木工",
  count: 2,
  totalCost: 8000,
  costDetails: {
    materialCost: 5500,
    laborCost: 2000,
    equipmentCost: 500,
    materialDesc: "屋面模板系统租赁",
    laborDesc: "木工高空作业工资",
    equipmentDesc: "高空作业设备"
  }
}, {
  id: 14,
  task: "屋面混凝土浇筑",
  startDate: "8月15日",
  endDate: "8月15日",
  duration: "1天",
  worker: "混凝土工",
  count: 2,
  totalCost: 12000,
  costDetails: {
    materialCost: 8000,
    laborCost: 2500,
    equipmentCost: 1500,
    materialDesc: "防水混凝土采购",
    laborDesc: "混凝土工高空作业工资",
    equipmentDesc: "高空泵送设备"
  }
}];

const getWorkerBadgeColor = (worker: string) => {
  const colors: {
    [key: string]: string;
  } = {
    "木工": "bg-blue-100 text-blue-800",
    "混凝土工": "bg-orange-100 text-orange-800",
    "砌筑工": "bg-green-100 text-green-800",
    "抹灰工": "bg-purple-100 text-purple-800",
    "安装工": "bg-pink-100 text-pink-800"
  };
  return colors[worker] || "bg-gray-100 text-gray-800";
};

const formatCurrency = (amount: number) => {
  return `¥${amount.toLocaleString()}`;
};

export function PlanOverview() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<typeof scheduleData[0] | null>(null);

  const handleViewDetails = (task: typeof scheduleData[0]) => {
    setSelectedTask(task);
    setIsSheetOpen(true);
  };

  return <div className="h-full flex flex-col p-6">
      <Tabs defaultValue="schedule" className="h-full flex flex-col">
        {/* 固定在顶部的部分 */}
        <div className="shrink-0 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">计划总览</h1>
            <p className="text-muted-foreground">项目施工进度规划与时间轴视图</p>
          </div>

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
      
        {/* 可滚动的内容区域 */}
        <div className="flex-1 overflow-auto">
          <TabsContent value="schedule" className="h-full m-0 py-4">
            <div className="w-full">
              <div>
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="rounded-md border">
                      {/* 固定表头 */}
                      <div className="sticky top-0 bg-background z-10 border-b">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/60">
                              <TableHead className="w-[180px]">任务名称</TableHead>
                              <TableHead className="w-[100px]">开始日期</TableHead>
                              <TableHead className="w-[100px]">结束日期</TableHead>
                              <TableHead className="w-[80px]">持续天数</TableHead>
                              <TableHead className="w-[100px]">工种</TableHead>
                              <TableHead className="w-[60px]">人数</TableHead>
                              <TableHead className="w-[100px] text-right">费用</TableHead>
                              <TableHead className="w-[120px]">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                        </Table>
                      </div>
                      
                      {/* 可滚动表格内容 */}
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
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
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewDetails(item)}
                                    >
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
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gantt" className="h-full m-0 py-4">
            <GanttChart data={scheduleData} />
          </TabsContent>
        </div>
      </Tabs>

      {/* 详情抽屉 */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="max-w-4xl w-full overflow-y-auto">
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selectedTask.task} - 详细信息</SheetTitle>
                <SheetDescription>
                  总费用：{formatCurrency(selectedTask.totalCost)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* 基本信息表格 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">任务基本信息</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium w-24">任务名称</TableCell>
                          <TableCell>{selectedTask.task}</TableCell>
                          <TableCell className="font-medium w-24">工种</TableCell>
                          <TableCell>
                            <Badge className={getWorkerBadgeColor(selectedTask.worker)}>
                              {selectedTask.worker}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">开始日期</TableCell>
                          <TableCell>{selectedTask.startDate}</TableCell>
                          <TableCell className="font-medium">结束日期</TableCell>
                          <TableCell>{selectedTask.endDate}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">持续天数</TableCell>
                          <TableCell>{selectedTask.duration}</TableCell>
                          <TableCell className="font-medium">人数</TableCell>
                          <TableCell>{selectedTask.count}人</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* 费用明细卡片 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">费用明细</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 材料费用卡片 */}
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-5 w-5 text-green-600" />
                          材料费用
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(selectedTask.costDetails.materialCost)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedTask.costDetails.materialDesc}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 人工费用卡片 */}
                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          人工费用
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(selectedTask.costDetails.laborCost)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedTask.costDetails.laborDesc}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 设备费用卡片 */}
                    <Card className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-orange-600" />
                          设备费用
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(selectedTask.costDetails.equipmentCost)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedTask.costDetails.equipmentDesc}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* 费用汇总 */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">费用汇总</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(selectedTask.totalCost)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    材料 {formatCurrency(selectedTask.costDetails.materialCost)} + 
                    人工 {formatCurrency(selectedTask.costDetails.laborCost)} + 
                    设备 {formatCurrency(selectedTask.costDetails.equipmentCost)}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>;
}
