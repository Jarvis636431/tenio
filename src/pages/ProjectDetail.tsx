import { useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, BarChart3, Activity, Edit, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GanttChart } from "@/components/GanttChart";

// 模拟进度数据
const scheduleData = [
  { id: 1, task: "地面支模", startDate: "8月1日", endDate: "8月1日", duration: "1天", worker: "木工", count: 2 },
  { id: 2, task: "地面混凝土浇筑", startDate: "8月2日", endDate: "8月4日", duration: "3天", worker: "混凝土工", count: 4 },
  { id: 3, task: "地面拆模", startDate: "8月5日", endDate: "8月5日", duration: "1天", worker: "木工", count: 3 },
  { id: 4, task: "柱支模", startDate: "8月5日", endDate: "8月5日", duration: "1天", worker: "木工", count: 2 },
  { id: 5, task: "柱混凝土浇筑", startDate: "8月6日", endDate: "8月6日", duration: "1天", worker: "混凝土工", count: 2 },
  { id: 6, task: "柱拆模", startDate: "8月7日", endDate: "8月7日", duration: "1天", worker: "木工", count: 2 },
  { id: 7, task: "承重墙支模", startDate: "8月6日", endDate: "8月6日", duration: "1天", worker: "木工", count: 4 },
  { id: 8, task: "承重墙混凝土浇筑", startDate: "8月7日", endDate: "8月9日", duration: "3天", worker: "混凝土工", count: 4 },
  { id: 9, task: "承重墙拆模", startDate: "8月10日", endDate: "8月10日", duration: "1天", worker: "木工", count: 4 },
  { id: 10, task: "砌体隔墙", startDate: "8月11日", endDate: "8月12日", duration: "2天", worker: "砌筑工", count: 4 },
  { id: 11, task: "抹灰", startDate: "8月13日", endDate: "8月17日", duration: "5天", worker: "抹灰工", count: 2 },
  { id: 12, task: "门窗安装", startDate: "8月13日", endDate: "8月13日", duration: "1天", worker: "安装工", count: 2 },
  { id: 13, task: "屋面支模", startDate: "8月14日", endDate: "8月14日", duration: "1天", worker: "木工", count: 2 },
  { id: 14, task: "屋面混凝土浇筑", startDate: "8月15日", endDate: "8月15日", duration: "1天", worker: "混凝土工", count: 2 },
];

const getWorkerBadgeColor = (worker: string) => {
  const colors: { [key: string]: string } = {
    "木工": "bg-blue-100 text-blue-800",
    "混凝土工": "bg-orange-100 text-orange-800",
    "砌筑工": "bg-green-100 text-green-800",
    "抹灰工": "bg-purple-100 text-purple-800",
    "安装工": "bg-pink-100 text-pink-800",
  };
  return colors[worker] || "bg-gray-100 text-gray-800";
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">办公楼建设项目</h1>
          <p className="text-muted-foreground">施工进度管理与监控</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            编辑项目
          </Button>
          <Button>
            <Activity className="mr-2 h-4 w-4" />
            实时监控
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            总进度规划表
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            施工工序甘特图
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            仪表盘
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>总进度规划表</CardTitle>
              <CardDescription>
                项目施工任务的详细进度规划与人员安排
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>任务名称</TableHead>
                      <TableHead>开始日期</TableHead>
                      <TableHead>结束日期</TableHead>
                      <TableHead>持续天数</TableHead>
                      <TableHead>工种</TableHead>
                      <TableHead>人数</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduleData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.task}</TableCell>
                        <TableCell>{item.startDate}</TableCell>
                        <TableCell>{item.endDate}</TableCell>
                        <TableCell>{item.duration}</TableCell>
                        <TableCell>
                          <Badge className={getWorkerBadgeColor(item.worker)}>
                            {item.worker}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              编辑
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              详情
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gantt" className="space-y-4">
          <GanttChart data={scheduleData} />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总任务数</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduleData.length}</div>
                <p className="text-xs text-muted-foreground">
                  当前项目规划任务
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总工期</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">17天</div>
                <p className="text-xs text-muted-foreground">
                  预计完工时间
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">工种数量</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">
                  涉及施工工种
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总人数</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">31</div>
                <p className="text-xs text-muted-foreground">
                  参与施工人员
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>项目仪表盘</CardTitle>
              <CardDescription>
                项目进度监控与数据分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
                <div className="text-center space-y-2">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">仪表盘组件待定</p>
                  <p className="text-sm text-muted-foreground">
                    将包含进度图表、资源分配和风险监控等功能
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}