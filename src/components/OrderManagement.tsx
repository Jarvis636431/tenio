
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  Download, 
  Calendar,
  Filter
} from "lucide-react";

interface OrderItem {
  id: number;
  orderNumber: string;
  drawingLocation: string;
  constructionContent: string;
  quantity: string;
  teamSize: number;
  jobRequirement: string;
  startDate: string;
  endDate: string;
  bidPrice: number;
  quotaPrice: number;
}

// 模拟订单数据
const mockOrders: OrderItem[] = [
  {
    id: 1,
    orderNumber: "9#_墙、梁、板钢筋制作_01号单",
    drawingLocation: "无",
    constructionContent: "现场钢筋制作加工",
    quantity: "16吨",
    teamSize: 2,
    jobRequirement: "钢筋工",
    startDate: "2025/8/1",
    endDate: "2025/8/3",
    bidPrice: 4000,
    quotaPrice: 3200
  },
  {
    id: 2,
    orderNumber: "9#_墙、梁、板钢筋制作_02号单",
    drawingLocation: "无",
    constructionContent: "现场钢筋制作加工",
    quantity: "16吨",
    teamSize: 2,
    jobRequirement: "钢筋工",
    startDate: "2025/8/4",
    endDate: "2025/8/6",
    bidPrice: 4000,
    quotaPrice: 3200
  },
  {
    id: 3,
    orderNumber: "9#_测量放线_01号单",
    drawingLocation: "9#楼_4层",
    constructionContent: "现场放线测量",
    quantity: "950平方米",
    teamSize: 1,
    jobRequirement: "无",
    startDate: "2025/8/1",
    endDate: "2025/8/1",
    bidPrice: 400,
    quotaPrice: 300
  },
  {
    id: 4,
    orderNumber: "9#_短肢剪力墙钢筋绑扎_01号单",
    drawingLocation: "",
    constructionContent: "现场剪力墙钢筋绑扎",
    quantity: "80立方米",
    teamSize: 4,
    jobRequirement: "钢筋工",
    startDate: "2025/8/7",
    endDate: "2025/8/8",
    bidPrice: 6400,
    quotaPrice: 5600
  },
  {
    id: 5,
    orderNumber: "9#_短肢剪力墙钢筋绑扎_02号单",
    drawingLocation: "",
    constructionContent: "现场剪力墙钢筋绑扎",
    quantity: "80立方米",
    teamSize: 4,
    jobRequirement: "钢筋工",
    startDate: "2025/8/8",
    endDate: "2025/8/9",
    bidPrice: 6400,
    quotaPrice: 5600
  },
  {
    id: 6,
    orderNumber: "9#_短肢剪力墙模板拼装_01号单",
    drawingLocation: "",
    constructionContent: "现场剪力墙模板拼装",
    quantity: "400平方米",
    teamSize: 2,
    jobRequirement: "模板工",
    startDate: "2025/8/10",
    endDate: "2025/8/11",
    bidPrice: 1600,
    quotaPrice: 1250
  },
  {
    id: 7,
    orderNumber: "9#_短肢剪力墙模板拼装_02号单",
    drawingLocation: "",
    constructionContent: "现场剪力墙模板拼装",
    quantity: "400平方米",
    teamSize: 2,
    jobRequirement: "模板工",
    startDate: "2025/8/11",
    endDate: "2025/8/12",
    bidPrice: 1600,
    quotaPrice: 1250
  },
  {
    id: 8,
    orderNumber: "9#_短肢剪力墙混凝土浇筑_01号单",
    drawingLocation: "9#楼_4层",
    constructionContent: "现场剪力墙混凝土浇筑",
    quantity: "150立方米",
    teamSize: 4,
    jobRequirement: "混凝土工",
    startDate: "2025/8/13",
    endDate: "2025/8/13",
    bidPrice: 2000,
    quotaPrice: 1480
  }
];

export function OrderManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [sortBy, setSortBy] = useState("startDate");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 获取工种选项
  const jobTypes = useMemo(() => {
    const types = Array.from(new Set(mockOrders.map(order => order.jobRequirement).filter(job => job !== "无")));
    return types;
  }, []);

  // 筛选和搜索逻辑
  const filteredOrders = useMemo(() => {
    let filtered = mockOrders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.constructionContent.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesJob = jobFilter === "all" || order.jobRequirement === jobFilter;
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
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, jobFilter, sortBy]);

  // 分页逻辑
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  // 获取工种Badge颜色
  const getJobBadgeColor = (job: string) => {
    switch (job) {
      case "钢筋工":
        return "bg-blue-100 text-blue-800";
      case "模板工":
        return "bg-green-100 text-green-800";
      case "混凝土工":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
      <div className="space-y-1">
        <h1 className="tracking-tight text-xl font-medium">订单管理</h1>
        <p className="text-muted-foreground font-light text-base">采购订单和供应商管理</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{mockOrders.length}</div>
            <p className="text-xs text-muted-foreground">总订单数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {mockOrders.filter(order => new Date(order.endDate) >= new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">进行中</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {mockOrders.filter(order => new Date(order.endDate) < new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">已完成</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              ¥{mockOrders.reduce((sum, order) => sum + order.bidPrice, 0).toLocaleString()}
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
                  placeholder="搜索单号或施工内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                新增订单
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                  <TableRow>
                    <TableHead className="min-w-[200px]">单号</TableHead>
                    <TableHead>图纸位置</TableHead>
                    <TableHead className="min-w-[150px]">施工内容</TableHead>
                    <TableHead>工程量</TableHead>
                    <TableHead>班组人数</TableHead>
                    <TableHead>工种要求</TableHead>
                    <TableHead>开始时间</TableHead>
                    <TableHead>结束时间</TableHead>
                    <TableHead>抢单价格</TableHead>
                    <TableHead>定额价格</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => {
                    const bidPriceInfo = getPriceDifference(order.bidPrice, order.quotaPrice);
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.drawingLocation || "-"}</TableCell>
                        <TableCell>{order.constructionContent}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{order.teamSize}人</TableCell>
                        <TableCell>
                          {order.jobRequirement === "无" ? (
                            <span className="text-muted-foreground">无</span>
                          ) : (
                            <Badge variant="secondary" className={getJobBadgeColor(order.jobRequirement)}>
                              {order.jobRequirement}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{order.startDate}</TableCell>
                        <TableCell>{order.endDate}</TableCell>
                        <TableCell className={bidPriceInfo.className}>
                          ¥{order.bidPrice.toLocaleString()}
                        </TableCell>
                        <TableCell>¥{order.quotaPrice.toLocaleString()}</TableCell>
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
              显示 {Math.min((currentPage - 1) * pageSize + 1, filteredOrders.length)} 到{" "}
              {Math.min(currentPage * pageSize, filteredOrders.length)} 条，共 {filteredOrders.length} 条记录
            </div>
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
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
