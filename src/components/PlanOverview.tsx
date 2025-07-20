import { useState } from "react";
import { Calendar, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GanttChart } from "@/components/GanttChart";

// 复用原有的进度数据
const scheduleData = [{
  id: 1,
  task: "地面支模",
  startDate: "8月1日",
  endDate: "8月1日",
  duration: "1天",
  worker: "木工",
  count: 2
}, {
  id: 2,
  task: "地面混凝土浇筑",
  startDate: "8月2日",
  endDate: "8月4日",
  duration: "3天",
  worker: "混凝土工",
  count: 4
}, {
  id: 3,
  task: "地面拆模",
  startDate: "8月5日",
  endDate: "8月5日",
  duration: "1天",
  worker: "木工",
  count: 3
}, {
  id: 4,
  task: "柱支模",
  startDate: "8月5日",
  endDate: "8月5日",
  duration: "1天",
  worker: "木工",
  count: 2
}, {
  id: 5,
  task: "柱混凝土浇筑",
  startDate: "8月6日",
  endDate: "8月6日",
  duration: "1天",
  worker: "混凝土工",
  count: 2
}, {
  id: 6,
  task: "柱拆模",
  startDate: "8月7日",
  endDate: "8月7日",
  duration: "1天",
  worker: "木工",
  count: 2
}, {
  id: 7,
  task: "承重墙支模",
  startDate: "8月6日",
  endDate: "8月6日",
  duration: "1天",
  worker: "木工",
  count: 4
}, {
  id: 8,
  task: "承重墙混凝土浇筑",
  startDate: "8月7日",
  endDate: "8月9日",
  duration: "3天",
  worker: "混凝土工",
  count: 4
}, {
  id: 9,
  task: "承重墙拆模",
  startDate: "8月10日",
  endDate: "8月10日",
  duration: "1天",
  worker: "木工",
  count: 4
}, {
  id: 10,
  task: "砌体隔墙",
  startDate: "8月11日",
  endDate: "8月12日",
  duration: "2天",
  worker: "砌筑工",
  count: 4
}, {
  id: 11,
  task: "抹灰",
  startDate: "8月13日",
  endDate: "8月17日",
  duration: "5天",
  worker: "抹灰工",
  count: 2
}, {
  id: 12,
  task: "门窗安装",
  startDate: "8月13日",
  endDate: "8月13日",
  duration: "1天",
  worker: "安装工",
  count: 2
}, {
  id: 13,
  task: "屋面支模",
  startDate: "8月14日",
  endDate: "8月14日",
  duration: "1天",
  worker: "木工",
  count: 2
}, {
  id: 14,
  task: "屋面混凝土浇筑",
  startDate: "8月15日",
  endDate: "8月15日",
  duration: "1天",
  worker: "混凝土工",
  count: 2
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
export function PlanOverview() {
  return <div className="h-full flex flex-col">
      <Tabs defaultValue="schedule" className="h-full flex flex-col">
        {/* 固定在顶部的部分 */}
        <div className="shrink-0 space-y-6 p-6 border-b px-0 py-[9px]">
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
          <TabsContent value="schedule" className="h-full m-0 p-6 px-0 py-0">
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
                              <TableHead className="w-[200px]">任务名称</TableHead>
                              <TableHead className="w-[120px]">开始日期</TableHead>
                              <TableHead className="w-[120px]">结束日期</TableHead>
                              <TableHead className="w-[100px]">持续天数</TableHead>
                              <TableHead className="w-[120px]">工种</TableHead>
                              <TableHead className="w-[80px]">人数</TableHead>
                              <TableHead className="w-[150px]">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                        </Table>
                      </div>
                      
                      {/* 可滚动表格内容 */}
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableBody>
                            {scheduleData.map(item => <TableRow key={item.id}>
                                <TableCell className="font-medium w-[200px]">{item.task}</TableCell>
                                <TableCell className="w-[120px]">{item.startDate}</TableCell>
                                <TableCell className="w-[120px]">{item.endDate}</TableCell>
                                <TableCell className="w-[100px]">{item.duration}</TableCell>
                                <TableCell className="w-[120px]">
                                  <Badge className={getWorkerBadgeColor(item.worker)}>
                                    {item.worker}
                                  </Badge>
                                </TableCell>
                                <TableCell className="w-[80px]">{item.count}</TableCell>
                                <TableCell className="w-[150px]">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                      编辑
                                    </Button>
                                    <Button variant="outline" size="sm">
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

          <TabsContent value="gantt" className="h-full m-0 p-6">
            <GanttChart data={scheduleData} />
          </TabsContent>
        </div>
      </Tabs>
    </div>;
}