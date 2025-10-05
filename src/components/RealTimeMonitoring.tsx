import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, DollarSign, Plus, Calendar, Table as TableIcon, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataEntryForm } from "@/components/DataEntryForm";
import { useDataEntry } from "@/hooks/useDataEntry";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// 工种数据 - 基于真实CSV数据
const jobTypes = {
  all: { name: "总计", color: "#8884d8" },
  "测量员": { name: "测量员", color: "#82ca9d" },
  "钢筋工": { name: "钢筋工", color: "#ffc658" },
  "木工": { name: "木工", color: "#ff7300" },
  "混凝土工": { name: "混凝土工", color: "#00ff00" },
  "安装工": { name: "安装工", color: "#ff00ff" },
  "不限": { name: "不限", color: "#8884d8" },
};

// 真实数据接口
interface DailyData {
  date: string;
  labor: number;
  cost: number;
}

interface JobTypeData {
  date: string;
  jobType: string;
  labor: number;
  cost: number;
}

// 模拟加载真实数据
const loadRealData = async () => {
  // 模拟总计数据（基于10层mock_每日总计.csv结构）
  const totalData: DailyData[] = [
    { date: "2025-09-01", labor: 5.0, cost: 1315.0 },
    { date: "2025-09-02", labor: 17.0, cost: 4515.0 },
    { date: "2025-09-03", labor: 14.0, cost: 5160.0 },
    { date: "2025-09-04", labor: 2.0, cost: 1800.0 },
    { date: "2025-09-05", labor: 0.0, cost: 0.0 },
    { date: "2025-09-07", labor: 12.57, cost: 1808.0 },
    { date: "2025-09-08", labor: 0.57, cost: 768.0 },
    { date: "2025-09-09", labor: 0.57, cost: 768.0 },
    { date: "2025-09-10", labor: 0.77, cost: 3434.67 },
    { date: "2025-09-11", labor: 4.77, cost: 3434.67 },
    { date: "2025-09-12", labor: 18.77, cost: 10152.38 },
    { date: "2025-09-13", labor: 14.69, cost: 10698.38 },
    { date: "2025-09-14", labor: 21.97, cost: 11212.38 },
    { date: "2025-09-15", labor: 0.97, cost: 5736.38 },
    { date: "2025-09-16", labor: 1.97, cost: 5976.38 },
    { date: "2025-09-17", labor: 6.04, cost: 9446.90 },
    { date: "2025-09-18", labor: 5.04, cost: 10870.90 },
    { date: "2025-09-19", labor: 7.04, cost: 10878.90 },
    { date: "2025-09-20", labor: 3.15, cost: 11574.90 },
  ];
  
  // 模拟工种细分数据（基于10层mock_每日按工种细分.csv结构）
  const jobTypeData: JobTypeData[] = [
    { date: "2025-09-01", jobType: "测量员", labor: 4.0, cost: 160.0 },
    { date: "2025-09-01", jobType: "钢筋工", labor: 1.0, cost: 1155.0 },
    { date: "2025-09-02", jobType: "钢筋工", labor: 17.0, cost: 4515.0 },
    { date: "2025-09-03", jobType: "木工", labor: 6.0, cost: 1800.0 },
    { date: "2025-09-03", jobType: "钢筋工", labor: 8.0, cost: 3360.0 },
    { date: "2025-09-04", jobType: "木工", labor: 2.0, cost: 1800.0 },
    { date: "2025-09-07", jobType: "不限", labor: 0.57, cost: 768.0 },
    { date: "2025-09-07", jobType: "混凝土工", labor: 12.0, cost: 1040.0 },
    { date: "2025-09-08", jobType: "不限", labor: 0.57, cost: 768.0 },
    { date: "2025-09-09", jobType: "不限", labor: 0.57, cost: 768.0 },
    { date: "2025-09-10", jobType: "不限", labor: 0.57, cost: 768.0 },
    { date: "2025-09-10", jobType: "安装工", labor: 0.2, cost: 2666.67 },
    { date: "2025-09-11", jobType: "不限", labor: 0.57, cost: 768.0 },
    { date: "2025-09-11", jobType: "安装工", labor: 0.2, cost: 2666.67 },
    { date: "2025-09-11", jobType: "木工", labor: 4.0, cost: 0.0 },
    { date: "2025-09-12", jobType: "不限", labor: 3.29, cost: 960.0 },
    { date: "2025-09-12", jobType: "安装工", labor: 0.2, cost: 2666.67 },
    { date: "2025-09-12", jobType: "木工", labor: 13.0, cost: 5760.0 },
    { date: "2025-09-12", jobType: "测量员", labor: 2.0, cost: 80.0 },
  ];
  
  return { totalData, jobTypeData };
};

interface RealTimeMonitoringProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

export function RealTimeMonitoring({ showExpandButton = false, onExpandSidebar }: RealTimeMonitoringProps) {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const [selectedJobType, setSelectedJobType] = useState<keyof typeof jobTypes>("all");
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [currentEntryContext, setCurrentEntryContext] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dataType, setDataType] = useState<'labor' | 'cost'>(tabFromUrl === 'cost' ? 'cost' : 'labor');
  const [showDetail, setShowDetail] = useState(false); // 是否显示工种明细
  const [totalData, setTotalData] = useState<DailyData[]>([]);
  const [jobTypeData, setJobTypeData] = useState<JobTypeData[]>([]);
  const itemsPerPage = 20;

  const { addDataEntry, getDataEntries } = useDataEntry();

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const data = await loadRealData();
      setTotalData(data.totalData);
      setJobTypeData(data.jobTypeData);
    };
    loadData();
  }, []);

  // 监听URL变化，更新数据类型
  useEffect(() => {
    if (tabFromUrl === 'cost') {
      setDataType('cost');
    } else {
      setDataType('labor');
    }
  }, [tabFromUrl]);

  const handleDataEntrySubmit = (entryData: any) => {
    if (!currentEntryContext) return;
    
    addDataEntry(
      currentEntryContext.category,
      currentEntryContext.type,
      {
        date: entryData.date,
        value: entryData.value,
        notes: entryData.notes,
      }
    );
  };

  const getDisplayData = () => {
    if (selectedJobType === "all") {
      // 显示总计数据
      return totalData.map(item => ({
        date: item.date,
        value: dataType === 'labor' ? item.labor : item.cost,
        plan: dataType === 'labor' ? item.labor * 1.1 : item.cost * 1.1 // 模拟计划值
      }));
    } else {
      // 显示特定工种数据
      const jobTypeName = selectedJobType; // 直接使用工种名称
      const filteredData = jobTypeData.filter(item => item.jobType === jobTypeName);
      return filteredData.map(item => ({
        date: item.date,
        value: dataType === 'labor' ? item.labor : item.cost,
        plan: dataType === 'labor' ? item.labor * 1.1 : item.cost * 1.1
      }));
    }
  };

  // 获取工种明细数据
  const getJobTypeDetailData = (date: string) => {
    return jobTypeData.filter(item => item.date === date);
  };

  const displayData = getDisplayData();
  
  // 分页数据
  const totalPages = Math.ceil(displayData.length / itemsPerPage);
  const paginatedData = displayData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 计算统计信息
  const stats = {
    totalActual: displayData.reduce((sum, item) => sum + item.value, 0),
    totalPlan: displayData.reduce((sum, item) => sum + item.plan, 0),
    averageActual: Math.round(displayData.reduce((sum, item) => sum + item.value, 0) / displayData.length),
    averagePlan: Math.round(displayData.reduce((sum, item) => sum + item.plan, 0) / displayData.length),
  };

  const formatValue = (value: number) => {
    if (dataType === 'cost') {
      return `¥${value.toLocaleString()}`;
    }
    return value.toString();
  };

  const getVarianceColor = (actual: number, plan: number) => {
    const variance = ((actual - plan) / plan) * 100;
    if (variance > 10) return "text-red-600";
    if (variance < -10) return "text-blue-600";
    return "text-green-600";
  };

  // 日历视图辅助函数
  const getCalendarData = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendarDays = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      // 格式化为 YYYY-MM-DD 格式以匹配数据
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = displayData.find(item => item.date === dateStr);
      
      calendarDays.push({
        date: new Date(currentDate),
        dateStr,
        data: dayData,
        isCurrentMonth: currentDate.getMonth() === currentMonth,
        isToday: currentDate.toDateString() === new Date().toDateString()
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return calendarDays;
  };

  const getDayStatus = (dayData: any) => {
    if (!dayData) return 'no-data';
    const variance = ((dayData.value - dayData.plan) / dayData.plan) * 100;
    if (variance > 10) return 'over';
    if (variance < -10) return 'under';
    return 'normal';
  };

  const getDayColor = (status: string) => {
    switch (status) {
      case 'over': return 'bg-red-100 border-red-300 text-red-800';
      case 'under': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'normal': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
                    <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          {tabFromUrl === 'cost' ? '人工成本' : tabFromUrl === 'labor' ? '施工人数' : '实时监测'}
        </h2>
        <div className="flex items-center gap-4">
          <Select value={selectedJobType} onValueChange={(value) => setSelectedJobType(value as keyof typeof jobTypes)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(jobTypes).map(([key, jobType]) => (
                <SelectItem key={key} value={key}>
                  {jobType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              表格视图
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              日历视图
            </Button>
            {selectedJobType === "all" && (
              <Button
                variant={showDetail ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDetail(!showDetail)}
              >
                {showDetail ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showDetail ? '隐藏明细' : '查看明细'}
              </Button>
            )}
          </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
              setCurrentEntryContext({
                category: dataType,
                type: selectedJobType,
                title: `${jobTypes[selectedJobType].name}${dataType === 'labor' ? '劳动力配置' : '人工费用'}`,
                unit: dataType === 'labor' ? '人' : '元',
                description: dataType === 'labor' ? '每日人员数量监控' : '每日人工费用支出监控',
              });
              setIsDataEntryOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            数据录入
                  </Button>
                    </div>
                </div>


      {/* 主内容区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {dataType === 'labor' ? <Users className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
            {jobTypes[selectedJobType].name}{dataType === 'labor' ? '劳动力配置' : '人工费用'}
          </CardTitle>
          <CardDescription>
            {dataType === 'labor' ? '每日人员数量监控' : '每日人工费用支出监控'} - 支持多年项目数据查看
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      {showDetail && selectedJobType === "all" ? (
                        <>
                          <TableHead>工种</TableHead>
                          <TableHead>实际{dataType === 'labor' ? '人数' : '费用'}</TableHead>
                          <TableHead>计划{dataType === 'labor' ? '人数' : '费用'}</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>实际{dataType === 'labor' ? '人数' : '费用'}</TableHead>
                          <TableHead>计划{dataType === 'labor' ? '人数' : '费用'}</TableHead>
                          <TableHead>差异</TableHead>
                          <TableHead>完成率</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showDetail && selectedJobType === "all" ? (
                      // 显示工种明细
                      (() => {
                        const detailData: { date: string; jobType: string; value: number; plan: number }[] = [];
                        paginatedData.forEach(item => {
                          const dayDetails = getJobTypeDetailData(item.date);
                          dayDetails.forEach(detail => {
                            detailData.push({
                              date: item.date,
                              jobType: detail.jobType,
                              value: dataType === 'labor' ? detail.labor : detail.cost,
                              plan: dataType === 'labor' ? detail.labor * 1.1 : detail.cost * 1.1
                            });
                          });
                        });
                        return detailData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-gray-100">
                                {item.jobType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={dataType === 'labor' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                                {dataType === 'labor' ? `${item.value}人` : `¥${item.value.toLocaleString()}`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {dataType === 'labor' ? `${item.plan.toFixed(1)}人` : `¥${item.plan.toLocaleString()}`}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ));
                      })()
                    ) : (
                      // 显示汇总数据
                      paginatedData.map((item, index) => {
                        const variance = item.value - item.plan;
                        const completionRate = ((item.value / item.plan) * 100).toFixed(1);
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.date}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={dataType === 'labor' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                                {dataType === 'labor' ? `${item.value}人` : `¥${item.value.toLocaleString()}`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {dataType === 'labor' ? `${item.plan.toFixed(1)}人` : `¥${item.plan.toLocaleString()}`}
                              </Badge>
                            </TableCell>
                            <TableCell className={getVarianceColor(item.value, item.plan)}>
                              {variance > 0 ? '+' : ''}{dataType === 'labor' ? `${variance.toFixed(1)}人` : `¥${variance.toLocaleString()}`}
                            </TableCell>
                            <TableCell>
                              <span className={getVarianceColor(item.value, item.plan)}>
                                {completionRate}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                      </div>
              
              {/* 分页 */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  显示 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, displayData.length)} 条，共 {displayData.length} 条
                    </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </Button>
                      </div>
                    </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* 日历导航 */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                >
                  ← 上月
                </Button>
                <h3 className="text-lg font-semibold">
                  {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                >
                  下月 →
                </Button>
                  </div>
              
              {/* 日历网格 */}
              <div className="grid grid-cols-7 gap-1">
                {/* 星期标题 */}
                {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                  <div key={day} className="p-2 text-center font-medium text-gray-500">
                    {day}
                      </div>
                ))}
                
                {/* 日历日期 */}
                {getCalendarData().map((day, index) => {
                  const status = getDayStatus(day.data);
                  const colorClass = getDayColor(status);
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 min-h-[80px] border rounded cursor-pointer hover:shadow-md transition-all ${
                        day.isCurrentMonth ? colorClass : 'bg-gray-50 text-gray-400'
                      } ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => {
                        if (day.data) {
                          console.log('点击日期:', day.dateStr, day.data);
                        }
                      }}
                    >
                      <div className="text-sm font-medium mb-1">
                        {day.date.getDate()}
                    </div>
                      {day.data && (
                        <div className="text-xs space-y-1">
                          <div className="font-medium">
                            实际: {dataType === 'labor' ? `${day.data.value}人` : `¥${day.data.value.toLocaleString()}`}
                      </div>
                          <div className="opacity-75">
                            计划: {dataType === 'labor' ? `${day.data.plan}人` : `¥${day.data.plan.toLocaleString()}`}
                    </div>
                          <div className={`text-xs font-medium ${
                            status === 'over' ? 'text-red-600' : 
                            status === 'under' ? 'text-blue-600' : 
                            'text-green-600'
                          }`}>
                            {status === 'over' ? '超支' : status === 'under' ? '节约' : '正常'}
                  </div>
                    </div>
                      )}
                      </div>
                  );
                })}
                </div>

              {/* 图例 */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span>超支</span>
                      </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>正常</span>
                    </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span>节约</span>
                    </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                  <span>无数据</span>
                  </div>
                  </div>
                </div>
          )}
        </CardContent>
      </Card>

      {/* 数据录入对话框 */}
      {isDataEntryOpen && (
        <DataEntryForm
          open={isDataEntryOpen}
          onOpenChange={setIsDataEntryOpen}
          onSubmit={handleDataEntrySubmit}
          title={currentEntryContext?.title}
          unit={currentEntryContext?.unit}
          description={currentEntryContext?.description}
        />
      )}
    </div>
  );
}