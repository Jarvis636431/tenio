import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Download, Calendar, Filter, Edit, Eye } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";

interface PlanAndOrdersProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

// 合并后的数据结构
interface TaskItem {
  id: number;
  orderNumber: string;
  task: string;
  drawingLocation: string;
  constructionContent: string;
  quantity: string;
  teamSize: number;
  jobRequirement: string;
  startDate: string;
  endDate: string;
  duration: string;
  bidPrice: number;
  quotaPrice: number;
  totalCost: number;
  costDetails?: {
    materialCost: number;
    laborCost: number;
    equipmentCost: number;
    materialDesc: string;
    laborDesc: string;
    equipmentDesc: string;
  };
}

// 办公楼项目数据
const officeBuildingData: TaskItem[] = [
  {
    id: 1,
    orderNumber: "9#_墙、梁、板钢筋制作_01号单",
    task: "墙、梁、板钢筋制作",
    drawingLocation: "无",
    constructionContent: "现场钢筋制作加工",
    quantity: "16吨",
    teamSize: 2,
    jobRequirement: "钢筋工",
    startDate: "2025/8/1",
    endDate: "2025/8/3",
    duration: "3天",
    bidPrice: 4000,
    quotaPrice: 3200,
    totalCost: 4000,
    costDetails: {
      materialCost: 2500,
      laborCost: 1000,
      equipmentCost: 500,
      materialDesc: "钢筋材料采购",
      laborDesc: "钢筋工工资",
      equipmentDesc: "加工设备租赁"
    }
  },
  {
    id: 2,
    orderNumber: "9#_测量放线_01号单",
    task: "测量放线",
    drawingLocation: "9#楼_4层",
    constructionContent: "现场放线测量",
    quantity: "950平方米",
    teamSize: 1,
    jobRequirement: "测量工",
    startDate: "2025/8/1",
    endDate: "2025/8/1",
    duration: "1天",
    bidPrice: 400,
    quotaPrice: 300,
    totalCost: 400,
    costDetails: {
      materialCost: 50,
      laborCost: 300,
      equipmentCost: 50,
      materialDesc: "测量标记材料",
      laborDesc: "测量工工资",
      equipmentDesc: "测量仪器使用"
    }
  },
  {
    id: 3,
    orderNumber: "9#_短肢剪力墙钢筋绑扎_01号单",
    task: "短肢剪力墙钢筋绑扎",
    drawingLocation: "",
    constructionContent: "现场剪力墙钢筋绑扎",
    quantity: "80立方米",
    teamSize: 4,
    jobRequirement: "钢筋工",
    startDate: "2025/8/7",
    endDate: "2025/8/8",
    duration: "2天",
    bidPrice: 6400,
    quotaPrice: 5600,
    totalCost: 6400,
    costDetails: {
      materialCost: 4000,
      laborCost: 2000,
      equipmentCost: 400,
      materialDesc: "钢筋及绑扎材料",
      laborDesc: "钢筋工团队工资",
      equipmentDesc: "绑扎工具租赁"
    }
  }
];

// 南山区幼儿园项目数据
const kindergartenData: TaskItem[] = [
  {
    id: 1,
    orderNumber: "幼儿园_地面支模_01号单",
    task: "地面支模",
    drawingLocation: "1层地面",
    constructionContent: "地面模板支设",
    quantity: "800平方米",
    teamSize: 2,
    jobRequirement: "木工",
    startDate: "2025/8/1",
    endDate: "2025/8/1",
    duration: "1天",
    bidPrice: 8000,
    quotaPrice: 6500,
    totalCost: 8000,
    costDetails: {
      materialCost: 5000,
      laborCost: 2000,
      equipmentCost: 1000,
      materialDesc: "模板及配件租赁",
      laborDesc: "木工工资及补贴",
      equipmentDesc: "支撑工具租赁"
    }
  },
  {
    id: 2,
    orderNumber: "幼儿园_地面混凝土浇筑_01号单",
    task: "地面混凝土浇筑",
    drawingLocation: "1层地面",
    constructionContent: "地面混凝土浇筑施工",
    quantity: "800平方米",
    teamSize: 4,
    jobRequirement: "混凝土工",
    startDate: "2025/8/2",
    endDate: "2025/8/4",
    duration: "3天",
    bidPrice: 15000,
    quotaPrice: 12000,
    totalCost: 15000,
    costDetails: {
      materialCost: 10000,
      laborCost: 3000,
      equipmentCost: 2000,
      materialDesc: "商品混凝土采购",
      laborDesc: "混凝土工工资",
      equipmentDesc: "搅拌车及泵车租赁"
    }
  },
  {
    id: 3,
    orderNumber: "幼儿园_墙体砌筑_01号单",
    task: "墙体砌筑",
    drawingLocation: "1-2层",
    constructionContent: "砖墙砌筑施工",
    quantity: "200立方米",
    teamSize: 4,
    jobRequirement: "砌筑工",
    startDate: "2025/8/5",
    endDate: "2025/8/8",
    duration: "4天",
    bidPrice: 18000,
    quotaPrice: 15000,
    totalCost: 18000,
    costDetails: {
      materialCost: 12000,
      laborCost: 4000,
      equipmentCost: 2000,
      materialDesc: "砖块及砂浆采购",
      laborDesc: "砌筑工工资",
      equipmentDesc: "砌筑工具及脚手架"
    }
  }
];

const getWorkerBadgeColor = (worker: string) => {
  const colors: { [key: string]: string } = {
    "钢筋工": "bg-blue-100 text-blue-800",
    "模板工": "bg-green-100 text-green-800",
    "混凝土工": "bg-orange-100 text-orange-800",
    "砌筑工": "bg-purple-100 text-purple-800",
    "抹灰工": "bg-pink-100 text-pink-800",
    "安装工": "bg-indigo-100 text-indigo-800",
    "测量工": "bg-yellow-100 text-yellow-800",
    "木工": "bg-teal-100 text-teal-800"
  };
  return colors[worker] || "bg-gray-100 text-gray-800";
};

const formatCurrency = (amount: number) => {
  return `¥${amount.toLocaleString()}`;
};

export function PlanAndOrders(props: PlanAndOrdersProps) {
  const { currentProject } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [sortBy, setSortBy] = useState("startDate");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 根据当前项目选择数据
  const allData = useMemo(() => {
    return currentProject?.id === "2" ? kindergartenData : officeBuildingData;
  }, [currentProject?.id]);

  // 获取工种选项
  const jobTypes = useMemo(() => {
    const types = Array.from(new Set(allData.map(item => item.jobRequirement)));
    return types;
  }, [allData]);

  // 筛选和搜索逻辑
  const filteredData = useMemo(() => {
    let filtered = allData.filter(item => {
      const matchesSearch = 
        item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.constructionContent.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesJob = jobFilter === "all" || item.jobRequirement === jobFilter;
      return matchesSearch && matchesJob;
    });

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "startDate":
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case "bidPrice":
          return b.bidPrice - a.bidPrice;
        case "teamSize":
          return b.teamSize - a.teamSize;
        case "totalCost":
          return b.totalCost - a.totalCost;
        default:
          return 0;
      }
    });
    return filtered;
  }, [allData, searchTerm, jobFilter, sortBy]);

  // 分页逻辑
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);
  
  const totalPages = Math.ceil(filteredData.length / pageSize);

  // 价格差异显示
  const getPriceDifference = (bidPrice: number, quotaPrice: number) => {
    const isHigher = bidPrice > quotaPrice;
    return {
      isHigher,
      className: isHigher ? "text-red-600 font-medium" : "text-green-600 font-medium"
    };
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{allData.length}</div>
            <p className="text-xs text-muted-foreground">总任务数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {allData.filter(item => new Date(item.endDate) >= new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">进行中</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {allData.filter(item => new Date(item.endDate) < new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">已完成</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              ¥{allData.reduce((sum, item) => sum + item.totalCost, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">总金额</p>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="搜索单号、任务或施工内容..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10" 
                />
              </div>

              {/* 工种筛选 */}
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="工种筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部工种</SelectItem>
                  {jobTypes.map(job => (
                    <SelectItem key={job} value={job}>{job}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 排序 */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startDate">按开始时间</SelectItem>
                  <SelectItem value="bidPrice">按抢单价格</SelectItem>
                  <SelectItem value="teamSize">按班组人数</SelectItem>
                  <SelectItem value="totalCost">按总费用</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                新增任务
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                  <TableRow>
                    <TableHead className="min-w-[200px]">单号</TableHead>
                    <TableHead className="min-w-[150px]">任务名称</TableHead>
                    <TableHead>图纸位置</TableHead>
                    <TableHead className="min-w-[150px]">施工内容</TableHead>
                    <TableHead>工程量</TableHead>
                    <TableHead>班组人数</TableHead>
                    <TableHead>工种要求</TableHead>
                    <TableHead>开始时间</TableHead>
                    <TableHead>结束时间</TableHead>
                    <TableHead>持续天数</TableHead>
                    <TableHead>抢单价格</TableHead>
                    <TableHead>定额价格</TableHead>
                    <TableHead>总费用</TableHead>
                    <TableHead className="min-w-[120px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map(item => {
                    const bidPriceInfo = getPriceDifference(item.bidPrice, item.quotaPrice);
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.orderNumber}</TableCell>
                        <TableCell className="font-medium">{item.task}</TableCell>
                        <TableCell>{item.drawingLocation || "-"}</TableCell>
                        <TableCell>{item.constructionContent}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.teamSize}人</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getWorkerBadgeColor(item.jobRequirement)}>
                            {item.jobRequirement}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.startDate}</TableCell>
                        <TableCell>{item.endDate}</TableCell>
                        <TableCell>{item.duration}</TableCell>
                        <TableCell className={bidPriceInfo.className}>
                          ¥{item.bidPrice.toLocaleString()}
                        </TableCell>
                        <TableCell>¥{item.quotaPrice.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.totalCost)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              编辑
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              详情
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 分页控件 */}
          <div className="flex items-center justify-between p-4">
            <div className="text-sm text-muted-foreground">
              显示 {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} 到{" "}
              {Math.min(currentPage * pageSize, filteredData.length)} 条，共 {filteredData.length} 条记录
            </div>
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={value => setPageSize(Number(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10条</SelectItem>
                  <SelectItem value="20">20条</SelectItem>
                  <SelectItem value="50">50条</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


