import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Download, Calendar, Filter, Edit, Eye, BarChart3, X } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { GanttChart } from "@/components/GanttChart";

interface PlanAndOrdersProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

// 新的施工工序数据结构
interface TaskItem {
  id: number;
  sequenceNumber: string; // 序号
  processName: string; // 工序名称
  quantity: number; // 工程量（来自广联达模型）
  unit: string; // 单位
  constructionMethod: string; // 施工方式
  duration: number; // 时间（天）
  workerCount: number; // 施工人数
  jobType: string; // 工种
  specialty: string; // 所属专业
  constructionTeam: string; // 施工队
  laborCost: number; // 人工成本（元/工日）
  materialCost: number; // 材料价格（元）
  totalLaborCost: number; // 总人工成本
  totalCost: number; // 总成本
}

// 办公楼项目数据
const officeBuildingData: TaskItem[] = [
  {
    id: 1,
    sequenceNumber: "1",
    processName: "基础开挖",
    quantity: 1200,
    unit: "m³",
    constructionMethod: "机械开挖",
    duration: 10,
    workerCount: 8,
    jobType: "土方工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 300,
    materialCost: 8000,
    totalLaborCost: 24000,
    totalCost: 32000
  },
  {
    id: 2,
    sequenceNumber: "2",
    processName: "基础垫层浇筑",
    quantity: 800,
    unit: "m³",
    constructionMethod: "商品混凝土",
    duration: 8,
    workerCount: 12,
    jobType: "混凝土工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 280,
    materialCost: 25000,
    totalLaborCost: 26880,
    totalCost: 51880
  },
  {
    id: 3,
    sequenceNumber: "3",
    processName: "基础钢筋绑扎",
    quantity: 45,
    unit: "t",
    constructionMethod: "现场绑扎",
    duration: 12,
    workerCount: 15,
    jobType: "钢筋工",
    specialty: "结构",
    constructionTeam: "施工2队",
    laborCost: 350,
    materialCost: 18000,
    totalLaborCost: 63000,
    totalCost: 81000
  },
  {
    id: 4,
    sequenceNumber: "4",
    processName: "基础混凝土浇筑",
    quantity: 800,
    unit: "m³",
    constructionMethod: "商品混凝土",
    duration: 10,
    workerCount: 12,
    jobType: "混凝土工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 280,
    materialCost: 25000,
    totalLaborCost: 33600,
    totalCost: 58600
  },
  {
    id: 5,
    sequenceNumber: "5",
    processName: "主体框架柱钢筋",
    quantity: 120,
    unit: "t",
    constructionMethod: "现场绑扎",
    duration: 25,
    workerCount: 20,
    jobType: "钢筋工",
    specialty: "结构",
    constructionTeam: "施工2队",
    laborCost: 350,
    materialCost: 48000,
    totalLaborCost: 175000,
    totalCost: 223000
  },
  {
    id: 6,
    sequenceNumber: "6",
    processName: "主体框架柱模板",
    quantity: 2500,
    unit: "m²",
    constructionMethod: "木模板",
    duration: 20,
    workerCount: 18,
    jobType: "木工",
    specialty: "结构",
    constructionTeam: "施工2队",
    laborCost: 400,
    materialCost: 15000,
    totalLaborCost: 144000,
    totalCost: 159000
  },
  {
    id: 7,
    sequenceNumber: "7",
    processName: "主体框架柱混凝土",
    quantity: 1200,
    unit: "m³",
    constructionMethod: "商品混凝土",
    duration: 15,
    workerCount: 15,
    jobType: "混凝土工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 280,
    materialCost: 37500,
    totalLaborCost: 63000,
    totalCost: 100500
  },
  {
    id: 8,
    sequenceNumber: "8",
    processName: "主体框架梁钢筋",
    quantity: 95,
    unit: "t",
    constructionMethod: "现场绑扎",
    duration: 20,
    workerCount: 18,
    jobType: "钢筋工",
    specialty: "结构",
    constructionTeam: "施工2队",
    laborCost: 350,
    materialCost: 38000,
    totalLaborCost: 126000,
    totalCost: 164000
  },
  {
    id: 9,
    sequenceNumber: "9",
    processName: "主体框架梁模板",
    quantity: 2000,
    unit: "m²",
    constructionMethod: "木模板",
    duration: 18,
    workerCount: 16,
    jobType: "木工",
    specialty: "结构",
    constructionTeam: "施工2队",
    laborCost: 400,
    materialCost: 12000,
    totalLaborCost: 115200,
    totalCost: 127200
  },
  {
    id: 10,
    sequenceNumber: "10",
    processName: "主体框架梁混凝土",
    quantity: 950,
    unit: "m³",
    constructionMethod: "商品混凝土",
    duration: 12,
    workerCount: 15,
    jobType: "混凝土工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 280,
    materialCost: 29625,
    totalLaborCost: 50400,
    totalCost: 80025
  },
  {
    id: 11,
    sequenceNumber: "11",
    processName: "楼板钢筋",
    quantity: 85,
    unit: "t",
    constructionMethod: "现场绑扎",
    duration: 15,
    workerCount: 16,
    jobType: "钢筋工",
    specialty: "结构",
    constructionTeam: "施工2队",
    laborCost: 350,
    materialCost: 34000,
    totalLaborCost: 84000,
    totalCost: 118000
  },
  {
    id: 12,
    sequenceNumber: "12",
    processName: "楼板模板",
    quantity: 1800,
    unit: "m²",
    constructionMethod: "木模板",
    duration: 12,
    workerCount: 14,
    jobType: "木工",
    specialty: "结构",
    constructionTeam: "施工2队",
    laborCost: 400,
    materialCost: 10800,
    totalLaborCost: 67200,
    totalCost: 78000
  },
  {
    id: 13,
    sequenceNumber: "13",
    processName: "楼板混凝土",
    quantity: 850,
    unit: "m³",
    constructionMethod: "商品混凝土",
    duration: 10,
    workerCount: 15,
    jobType: "混凝土工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 280,
    materialCost: 26500,
    totalLaborCost: 42000,
    totalCost: 68500
  }
];

// 南山区幼儿园项目数据
const kindergartenData: TaskItem[] = [
  {
    id: 1,
    sequenceNumber: "1",
    processName: "基础开挖",
    quantity: 800,
    unit: "m³",
    constructionMethod: "机械开挖",
    duration: 8,
    workerCount: 6,
    jobType: "土方工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 300,
    materialCost: 5000,
    totalLaborCost: 14400,
    totalCost: 19400
  },
  {
    id: 2,
    sequenceNumber: "2",
    processName: "基础垫层浇筑",
    quantity: 500,
    unit: "m³",
    constructionMethod: "商品混凝土",
    duration: 6,
    workerCount: 10,
    jobType: "混凝土工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 280,
    materialCost: 15000,
    totalLaborCost: 16800,
    totalCost: 31800
  },
  {
    id: 3,
    sequenceNumber: "3",
    processName: "剪力墙钢筋",
    quantity: 60,
    unit: "t",
    constructionMethod: "现场绑扎",
    duration: 15,
    workerCount: 12,
    jobType: "钢筋工",
    specialty: "结构",
    constructionTeam: "施工2队",
    laborCost: 350,
    materialCost: 24000,
    totalLaborCost: 63000,
    totalCost: 87000
  },
  {
    id: 4,
    sequenceNumber: "4",
    processName: "剪力墙模板",
    quantity: 1500,
    unit: "m²",
    constructionMethod: "木模板",
    duration: 12,
    workerCount: 10,
    jobType: "木工",
    specialty: "结构",
    constructionTeam: "施工2队",
    laborCost: 400,
    materialCost: 9000,
    totalLaborCost: 48000,
    totalCost: 57000
  },
  {
    id: 5,
    sequenceNumber: "5",
    processName: "剪力墙梁板混凝土",
    quantity: 600,
    unit: "m³",
    constructionMethod: "商品混凝土",
    duration: 8,
    workerCount: 12,
    jobType: "混凝土工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 280,
    materialCost: 18750,
    totalLaborCost: 26880,
    totalCost: 45630
  },
  {
    id: 6,
    sequenceNumber: "6",
    processName: "砌体工程",
    quantity: 1200,
    unit: "m²",
    constructionMethod: "加气混凝土砌块",
    duration: 20,
    workerCount: 12,
    jobType: "瓦工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 400,
    materialCost: 18000,
    totalLaborCost: 96000,
    totalCost: 114000
  },
  {
    id: 7,
    sequenceNumber: "7",
    processName: "抹灰工程",
    quantity: 2000,
    unit: "m²",
    constructionMethod: "水泥砂浆",
    duration: 25,
    workerCount: 15,
    jobType: "抹灰工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 400,
    materialCost: 12000,
    totalLaborCost: 150000,
    totalCost: 162000
  },
  {
    id: 8,
    sequenceNumber: "8",
    processName: "防水工程",
    quantity: 800,
    unit: "m²",
    constructionMethod: "SBS防水卷材",
    duration: 10,
    workerCount: 8,
    jobType: "防水工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 480,
    materialCost: 16000,
    totalLaborCost: 38400,
    totalCost: 54400
  },
  {
    id: 9,
    sequenceNumber: "9",
    processName: "水电安装",
    quantity: 1,
    unit: "项",
    constructionMethod: "预埋安装",
    duration: 30,
    workerCount: 10,
    jobType: "水电工",
    specialty: "水电",
    constructionTeam: "施工3队",
    laborCost: 500,
    materialCost: 25000,
    totalLaborCost: 150000,
    totalCost: 175000
  },
  {
    id: 10,
    sequenceNumber: "10",
    processName: "装修工程",
    quantity: 2000,
    unit: "m²",
    constructionMethod: "乳胶漆",
    duration: 20,
    workerCount: 12,
    jobType: "油工",
    specialty: "建筑",
    constructionTeam: "施工1队",
    laborCost: 400,
    materialCost: 15000,
    totalLaborCost: 96000,
    totalCost: 111000
  }
];

export function PlanAndOrders({ showExpandButton = false, onExpandSidebar }: PlanAndOrdersProps) {
  const { currentProject } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"sequenceNumber" | "duration" | "workerCount" | "totalCost">("sequenceNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // 根据当前项目选择数据
  const allData = useMemo(() => {
    if (currentProject?.id === "2") {
      return kindergartenData;
    }
    return officeBuildingData;
  }, [currentProject?.id]);

  // 工种类型
  const jobTypes = useMemo(() => {
    const types = new Set(allData.map(item => item.jobType));
    return Array.from(types);
  }, [allData]);

  // 过滤和排序数据
  const filteredData = useMemo(() => {
    let filtered = allData.filter(item => {
      const matchesSearch = item.processName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.sequenceNumber.includes(searchTerm);
      const matchesJob = jobFilter === "all" || item.jobType === jobFilter;
      return matchesSearch && matchesJob;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case "sequenceNumber":
          aValue = parseInt(a.sequenceNumber);
          bValue = parseInt(b.sequenceNumber);
          break;
        case "duration":
          aValue = a.duration;
          bValue = b.duration;
          break;
        case "workerCount":
          aValue = a.workerCount;
          bValue = b.workerCount;
          break;
        case "totalCost":
          aValue = a.totalCost;
          bValue = b.totalCost;
          break;
        default:
          aValue = a.sequenceNumber;
          bValue = b.sequenceNumber;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [allData, searchTerm, jobFilter, sortBy, sortOrder]);

  // 分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // 总页数
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // 工种颜色
  const getJobTypeColor = (jobType: string) => {
    const colors: Record<string, string> = {
      "土方工": "bg-orange-100 text-orange-800",
      "混凝土工": "bg-blue-100 text-blue-800",
      "钢筋工": "bg-red-100 text-red-800",
      "木工": "bg-green-100 text-green-800",
      "瓦工": "bg-yellow-100 text-yellow-800",
      "抹灰工": "bg-purple-100 text-purple-800",
      "防水工": "bg-indigo-100 text-indigo-800",
      "水电工": "bg-pink-100 text-pink-800",
      "油工": "bg-gray-100 text-gray-800"
    };
    return colors[jobType] || "bg-gray-100 text-gray-800";
  };

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  // 处理详情按钮点击
  const handleDetailClick = (item: TaskItem) => {
    setSelectedItem(item);
    setIsDetailDialogOpen(true);
  };

  // 关闭详情对话框
  const handleCloseDetail = () => {
    setIsDetailDialogOpen(false);
    setSelectedItem(null);
  };

  // 甘特图数据转换
  const ganttData = useMemo(() => {
    return allData.map(item => ({
      id: item.id,
      task: `${item.sequenceNumber}. ${item.processName}`,
      startDate: `2024-01-${String(1 + (item.id - 1) * 5).padStart(2, '0')}`,
      endDate: `2024-01-${String(1 + (item.id - 1) * 5 + item.duration).padStart(2, '0')}`,
      duration: `${item.duration}天`,
      worker: item.jobType,
      count: item.workerCount
    }));
  }, [allData]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* 操作栏 */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="搜索序号、工序名称..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-10" 
            />
          </div>
          
          {/* 筛选器 */}
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-48 bg-background">
              <SelectValue placeholder="筛选工种" />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              <SelectItem value="all">全部工种</SelectItem>
              {jobTypes.map(job => (
                <SelectItem key={job} value={job}>{job}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            添加任务
          </Button>
        </div>
      </div>

      <Tabs defaultValue="table" className="h-full flex flex-col">
        {/* 固定在顶部的部分 */}
        <div className="shrink-0 space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              任务总览表
            </TabsTrigger>
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              施工工序甘特图
            </TabsTrigger>
          </TabsList>
        </div>
      
        {/* 可滚动的内容区域 - 自适应高度 */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="table" className="h-full m-0 py-4">
            <div className="h-full flex flex-col space-y-6">
              {/* 数据表格 */}
              <Card className="flex-1">
                <CardContent className="p-0 h-full">
                  <div className="h-full overflow-hidden">
                    <div className="h-full overflow-auto">
                      <div className="relative">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                            <TableRow>
                              <TableHead className="sticky left-0 z-20 min-w-[300px] border-r">
                                工序名称
                              </TableHead>
                              <TableHead className="min-w-[150px]">施工方式</TableHead>
                              <TableHead className="min-w-[100px]">时间(天)</TableHead>
                              <TableHead className="min-w-[120px]">工种</TableHead>
                              <TableHead className="min-w-[100px]">所属专业</TableHead>
                              <TableHead className="min-w-[120px]">施工队</TableHead>
                              <TableHead className="sticky right-0 z-20 min-w-[120px] border-l">
                                操作
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedData.map(item => (
                              <TableRow key={item.id} className="hover:bg-muted/50">
                                <TableCell className="sticky left-0 z-10 border-r font-medium">
                                  <div className="font-semibold">{item.sequenceNumber}. {item.processName}</div>
                                </TableCell>
                                <TableCell>{item.constructionMethod}</TableCell>
                                <TableCell className="font-medium">{item.duration}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={getJobTypeColor(item.jobType)}>
                                    {item.jobType}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {item.specialty}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {item.constructionTeam}
                                  </Badge>
                                </TableCell>
                                <TableCell className="sticky right-0 z-10 border-l">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-4 w-4 mr-1" />
                                      编辑
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDetailClick(item)}>
                                      <Eye className="h-4 w-4 mr-1" />
                                      详情
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* 分页控件 */}
                    <div className="flex items-center justify-between p-4 border-t">
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gantt" className="h-full m-0 py-4">
            <div className="h-full">
              <GanttChart data={ganttData} />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* 详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>工序详情 - {selectedItem?.sequenceNumber}. {selectedItem?.processName}</span>
              <Button variant="ghost" size="sm" onClick={handleCloseDetail}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">序号</label>
                      <p className="text-sm">{selectedItem.sequenceNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">工序名称</label>
                      <p className="text-sm">{selectedItem.processName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">施工方式</label>
                      <p className="text-sm">{selectedItem.constructionMethod}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">时间</label>
                      <p className="text-sm">{selectedItem.duration} 天</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">工种</label>
                      <div className="mt-1">
                        <Badge variant="secondary" className={getJobTypeColor(selectedItem.jobType)}>
                          {selectedItem.jobType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">所属专业</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {selectedItem.specialty}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">施工队</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {selectedItem.constructionTeam}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 工程量信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">工程量信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">工程量</label>
                      <p className="text-sm">{selectedItem.quantity.toLocaleString()} {selectedItem.unit}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">施工人数</label>
                      <p className="text-sm">{selectedItem.workerCount} 人</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 成本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">成本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">人工成本（元/工日）</label>
                      <p className="text-sm font-medium">{formatCurrency(selectedItem.laborCost)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">材料价格（元）</label>
                      <p className="text-sm font-medium">{formatCurrency(selectedItem.materialCost)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">总人工成本（元）</label>
                      <p className="text-sm font-medium">{formatCurrency(selectedItem.totalLaborCost)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">总成本（元）</label>
                      <p className="text-lg font-bold text-primary">{formatCurrency(selectedItem.totalCost)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseDetail}>
                  关闭
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑工序
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}