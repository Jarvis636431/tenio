import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProjectScheduleItem } from "@/hooks/useProjectSchedule";

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

interface TaskOverviewProps {
  paginatedData: TaskItem[];
  currentPage: number;
  itemsPerPage: number;
  filteredDataLength: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditClick: (item: TaskItem) => void;
  onDetailClick: (item: TaskItem) => void;
  onMoreClick: (item: TaskItem) => void;
}

export function TaskOverview({
  paginatedData,
  currentPage,
  itemsPerPage,
  filteredDataLength,
  totalPages,
  onPageChange,
  onEditClick,
  onDetailClick,
  onMoreClick
}: TaskOverviewProps) {
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

  return (
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
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => onEditClick(item)}>
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => onDetailClick(item)}>
                          详情
                        </Button>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => onMoreClick(item)}>
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
            显示 {((currentPage - 1) * itemsPerPage) + 1} 到 {Math.min(currentPage * itemsPerPage, filteredDataLength)} 条，共 {filteredDataLength} 条记录
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}