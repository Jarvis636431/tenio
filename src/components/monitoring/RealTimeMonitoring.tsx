import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { Users, DollarSign, Plus, Calendar, Table as TableIcon, BarChart3, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataEntryForm } from "@/components/monitoring/DataEntryForm";
import { useDataEntry } from "@/hooks/useDataEntry";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from "recharts";

// 工种数据 - 基于真实CSV数据
const jobTypes = {
  all: { name: "全部工种", color: "#8884d8" },
  "不限": { name: "不限", color: "#82ca9d" },
  "安装工": { name: "安装工", color: "#ffc658" },
  "抹灰工": { name: "抹灰工", color: "#ff7300" },
  "木工": { name: "木工", color: "#00ff00" },
  "水电工": { name: "水电工", color: "#ff00ff" },
  "测量员": { name: "测量员", color: "#8884d8" },
  "混凝土工": { name: "混凝土工", color: "#82ca9d" },
  "砌筑工": { name: "砌筑工", color: "#ffc658" },
  "管道工": { name: "管道工", color: "#ff7300" },
  "钢筋工": { name: "钢筋工", color: "#00ff00" },
  "防水工": { name: "防水工", color: "#ff00ff" },
};

// 真实数据接口 - 基于新的CSV结构
interface DailyData {
  date: string;
  totalLabor: number;        // 总施工人数
  totalCost: number;         // 总劳动力成本
  actualLabor: number;       // 总施工实际人数
  actualCost: number;        // 总劳动力实际成本
}

interface JobTypeData {
  date: string;
  jobType: string;
  planLabor: number;         // 计划人数
  planCost: number;          // 计划成本
  actualLabor: number;       // 实际人数
  actualCost: number;        // 实际成本
}

// 基于CSV数据的快速生成函数
const loadRealData = async () => {
  // 生成总计数据 - 基于CSV中的实际数据
  const totalData: DailyData[] = [];
  const jobTypeData: JobTypeData[] = [];
  
  // 工种映射
  const jobTypeMapping = {
    '不限': { planLabor: '不限人数', planCost: '不限成本', actualLabor: '不限实际人数', actualCost: '不限实际成本' },
    '安装工': { planLabor: '安装工人数', planCost: '安装工成本', actualLabor: '安装工实际人数', actualCost: '安装工实际成本' },
    '抹灰工': { planLabor: '抹灰工人数', planCost: '抹灰工成本', actualLabor: '抹灰工实际人数', actualCost: '抹灰工实际成本' },
    '木工': { planLabor: '木工人数', planCost: '木工成本', actualLabor: '木工实际人数', actualCost: '木工实际成本' },
    '水电工': { planLabor: '水电工人数', planCost: '水电工成本', actualLabor: '水电工实际人数', actualCost: '水电工实际成本' },
    '测量员': { planLabor: '测量员人数', planCost: '测量员成本', actualLabor: '测量员实际人数', actualCost: '测量员实际成本' },
    '混凝土工': { planLabor: '混凝土工人数', planCost: '混凝土工成本', actualLabor: '混凝土工实际人数', actualCost: '混凝土工实际成本' },
    '砌筑工': { planLabor: '砌筑工人数', planCost: '砌筑工成本', actualLabor: '砌筑工实际人数', actualCost: '砌筑工实际成本' },
    '管道工': { planLabor: '管道工人数', planCost: '管道工成本', actualLabor: '管道工实际人数', actualCost: '管道工实际成本' },
    '钢筋工': { planLabor: '钢筋工人数', planCost: '钢筋工成本', actualLabor: '钢筋工实际人数', actualCost: '钢筋工实际成本' },
    '防水工': { planLabor: '防水工人数', planCost: '防水工成本', actualLabor: '防水工实际人数', actualCost: '防水工实际成本' },
  };

  // 从public目录读取CSV文件
  const csvUrl = '/Database/10层mock_每日汇总_含工种细分_带实际字段_含模拟数据.csv';
  const resp = await fetch(csvUrl);
  if (!resp.ok) {
    console.error('Failed to fetch CSV:', resp.status, resp.statusText);
    return { totalData, jobTypeData };
  }
  const text = await resp.text();
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return { totalData, jobTypeData };

  const headers = lines[0].split(',');
  const get = (arr: string[], key: string) => {
    const idx = headers.indexOf(key);
    if (idx === -1) return '';
    return arr[idx] ?? '';
  };

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row) continue;
    const cols = row.split(',');
    const date = get(cols, '日期');
    if (!date) continue;

    const totalLabor = Number(get(cols, '总施工人数')) || 0;
    const totalCost = Number(get(cols, '总劳动力成本')) || 0;
    const actualLabor = Number(get(cols, '总实际施工人数')) || Number(get(cols, '总施工实际人数')) || 0;
    const actualCost = Number(get(cols, '总实际劳动力成本')) || Number(get(cols, '总劳动力实际成本')) || 0;

    totalData.push({ date, totalLabor, totalCost, actualLabor, actualCost });

    const allJobTypes = Object.keys(jobTypeMapping);
    allJobTypes.forEach((jt) => {
      const m = jobTypeMapping[jt as keyof typeof jobTypeMapping];
      const planLabor = Number(get(cols, m.planLabor)) || 0;
      const planCost = Number(get(cols, m.planCost)) || 0;
      const actualLaborJT = Number(get(cols, m.actualLabor)) || 0;
      const actualCostJT = Number(get(cols, m.actualCost)) || 0;
      if (planLabor !== 0 || actualLaborJT !== 0 || planCost !== 0 || actualCostJT !== 0) {
        jobTypeData.push({ date, jobType: jt, planLabor, planCost, actualLabor: actualLaborJT, actualCost: actualCostJT });
      }
    });
  }

  console.log('Loaded totalData:', totalData.length, 'items');
  console.log('Loaded jobTypeData:', jobTypeData.length, 'items');
  
  return { totalData, jobTypeData };
};

interface RealTimeMonitoringProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

export function RealTimeMonitoring({ showExpandButton = false, onExpandSidebar }: RealTimeMonitoringProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // 从路径获取数据类型
  const getDataTypeFromPath = (): 'labor' | 'cost' => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    return lastSegment === 'cost' ? 'cost' : 'labor';
  };
  
  const [selectedJobType, setSelectedJobType] = useState<keyof typeof jobTypes>("all");
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [currentEntryContext, setCurrentEntryContext] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'weekly'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 8, 1)); // 初始定位到2025年9月
  const [dataType, setDataType] = useState<'labor' | 'cost'>(getDataTypeFromPath());
  const [detailForDate, setDetailForDate] = useState<string | null>(null);
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

  // 监听路径变化，更新数据类型
  useEffect(() => {
    setDataType(getDataTypeFromPath());
  }, [location.pathname]);

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

  // 获取有数据的工种列表
  const getAvailableJobTypes = () => {
    const availableJobTypes = new Set<string>();
    
    // 遍历所有工种数据，找出有数据的工种
    jobTypeData.forEach(item => {
      const hasData = dataType === 'labor' 
        ? (item.planLabor > 0 || item.actualLabor > 0)
        : (item.planCost > 0 || item.actualCost > 0);
      
      if (hasData) {
        availableJobTypes.add(item.jobType);
      }
    });
    
    return Array.from(availableJobTypes);
  };

  const getDisplayData = () => {
    // 先获取所有数据并计算原始值和计划值
    let allData;
    if (selectedJobType === "all") {
      allData = totalData.map(item => {
        return {
          date: item.date,
          originalValue: dataType === 'labor' ? item.actualLabor : item.actualCost,
          planValue: dataType === 'labor' ? item.totalLabor : item.totalCost
        };
      });
    } else {
      const jobTypeName = selectedJobType;
      const filteredData = jobTypeData.filter(item => item.jobType === jobTypeName);
      allData = filteredData.map(item => {
        return {
          date: item.date,
          originalValue: dataType === 'labor' ? item.actualLabor : item.actualCost,
          planValue: dataType === 'labor' ? item.planLabor : item.planCost
        };
      });
    }
    
    // 获取需要显示实际值的日期列表
    let datesToShowActual = [];
    
    // 计算当前数据类型差异最大的日期
    const currentTypeOverDays = allData.filter(item => item.originalValue > item.planValue);
    currentTypeOverDays.sort((a, b) => ((b.originalValue - b.planValue) / b.planValue) - ((a.originalValue - a.planValue) / a.planValue));
    if (currentTypeOverDays.length > 0) {
      datesToShowActual.push(currentTypeOverDays[0].date);
    }
    
    // 如果当前是成本页面，还需要添加施工人数超计划的日期
    if (dataType === 'cost') {
      let laborOverDays;
      if (selectedJobType === "all") {
        laborOverDays = totalData.map(item => {
          return {
            date: item.date,
            originalValue: item.actualLabor,
            planValue: item.totalLabor
          };
        });
      } else {
        const jobTypeName = selectedJobType;
        const filteredData = jobTypeData.filter(item => item.jobType === jobTypeName);
        laborOverDays = filteredData.map(item => {
          return {
            date: item.date,
            originalValue: item.actualLabor,
            planValue: item.planLabor
          };
        });
      }
      
      // 计算施工人数差异最大的日期
      laborOverDays = laborOverDays.filter(item => item.originalValue > item.planValue);
      laborOverDays.sort((a, b) => ((b.originalValue - b.planValue) / b.planValue) - ((a.originalValue - a.planValue) / a.planValue));
      
      // 如果施工人数有超计划的日期，添加到结果中
      if (laborOverDays.length > 0) {
        datesToShowActual.push(laborOverDays[0].date);
      }
      
      // 去重
      datesToShowActual = [...new Set(datesToShowActual)];
    }
    
    // 生成显示数据
    return allData.map(item => {
      // 需要显示实际值的日期列表中的日期显示实际值，其他日期显示计划值
      const displayValue = datesToShowActual.includes(item.date) ? item.originalValue : item.planValue;
      
      return {
        date: item.date,
        value: displayValue,
        plan: item.planValue,
        originalValue: item.originalValue
      };
    });
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

  const getVarianceColor = (actual: number, plan: number, originalValue?: number) => {
    // 使用原始实际值来判断是否超计划
    if (originalValue && originalValue > plan) return "text-category-red-600";
    if (actual === plan) return "text-gray-600";
    // 实际数小于计划数的情况也使用灰色
    return "text-gray-600";
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
      // 格式化为 YYYY-MM-DD 格式以匹配数据，避免时区问题
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
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

  // 计算差异并排序，只保留差异最大的1个为红色
  const getOverDays = () => {
    let overDates = [];
    
    // 获取当前数据类型的超计划日期
    let currentTypeOverDays;
    if (selectedJobType === "all") {
      currentTypeOverDays = totalData.map(item => {
        return {
          date: item.date,
          originalValue: dataType === 'labor' ? item.actualLabor : item.actualCost,
          planValue: dataType === 'labor' ? item.totalLabor : item.totalCost
        };
      });
    } else {
      const jobTypeName = selectedJobType;
      const filteredData = jobTypeData.filter(item => item.jobType === jobTypeName);
      currentTypeOverDays = filteredData.map(item => {
        return {
          date: item.date,
          originalValue: dataType === 'labor' ? item.actualLabor : item.actualCost,
          planValue: dataType === 'labor' ? item.planLabor : item.planCost
        };
      });
    }
    
    // 计算当前类型差异最大的日期
    currentTypeOverDays = currentTypeOverDays.filter(item => item.originalValue > item.planValue);
    currentTypeOverDays.sort((a, b) => ((b.originalValue - b.planValue) / b.planValue) - ((a.originalValue - a.planValue) / a.planValue));
    
    // 只保留当前类型差异最大的1个日期
    if (currentTypeOverDays.length > 0) {
      overDates.push(currentTypeOverDays[0].date);
    }
    
    // 如果当前是成本页面，还需要添加施工人数超计划的日期
    if (dataType === 'cost') {
      let laborOverDays;
      if (selectedJobType === "all") {
        laborOverDays = totalData.map(item => {
          return {
            date: item.date,
            originalValue: item.actualLabor,
            planValue: item.totalLabor
          };
        });
      } else {
        const jobTypeName = selectedJobType;
        const filteredData = jobTypeData.filter(item => item.jobType === jobTypeName);
        laborOverDays = filteredData.map(item => {
          return {
            date: item.date,
            originalValue: item.actualLabor,
            planValue: item.planLabor
          };
        });
      }
      
      // 计算施工人数差异最大的日期
      laborOverDays = laborOverDays.filter(item => item.originalValue > item.planValue);
      laborOverDays.sort((a, b) => ((b.originalValue - b.planValue) / b.planValue) - ((a.originalValue - a.planValue) / a.planValue));
      
      // 如果施工人数有超计划的日期，添加到结果中
      if (laborOverDays.length > 0) {
        overDates.push(laborOverDays[0].date);
      }
      
      // 去重
      overDates = [...new Set(overDates)];
    }
    
    return overDates;
  };

  const overDays = getOverDays();

  const getDayStatus = (dayData: any) => {
    if (!dayData) return 'no-data';
    // 使用原始实际值来判断是否超计划
    if (dayData.originalValue > dayData.plan && overDays.includes(dayData.date)) return 'over';
    // 实际数等于计划数的情况显示正常灰色
    if (dayData.value === dayData.plan) return 'normal';
    // 实际数小于计划数的情况也显示正常灰色
    return 'normal';
  };

  const getDayColor = (status: string) => {
    switch (status) {
      case 'over': return 'bg-category-red-50 text-category-red-800';
      // 将绿色改为灰色
      case 'under': return 'bg-gray-50 text-gray-800';
      case 'normal': return 'bg-gray-50 text-gray-800';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  // 周视图数据处理 - 显示一周内每天的情况
  const getWeeklyData = () => {
    const data = getDisplayData();
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    
    // 获取当前选中日期所在的一周
    const currentDate = new Date(selectedDate);
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // 获取周一
    
    const weeklyData = [];
    
    // 生成一周的数据
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      // 避免时区问题的日期格式化
      const year = dayDate.getFullYear();
      const month = String(dayDate.getMonth() + 1).padStart(2, '0');
      const day = String(dayDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // 查找对应日期的数据
      const dayData = data.find(item => item.date === dateStr);
      
      weeklyData.push({
        day: weekDays[i],
        date: dateStr,
        actual: dayData ? dayData.value : 0, // 使用处理后的值，确保非红色部分显示计划值
        plan: dayData ? dayData.plan : 0,
        hasData: !!dayData
      });
    }
    
    return weeklyData;
  };

  // 生成指定日期的工种细分，仅返回非 0 的数据
  const getBreakdownByDate = (dateStr: string) => {
    const forDate = jobTypeData.filter((item) => item.date === dateStr);
    return forDate
      .map((item) => ({
        jobType: item.jobType,
        planValue: dataType === 'labor' ? item.planLabor : item.planCost,
        actualValue: dataType === 'labor' ? item.actualLabor : item.actualCost,
      }))
      .filter((x) => x.planValue !== 0 || x.actualValue !== 0);
  };

  // 通用自定义 Tooltip：当选择"全部工种"时展示工种细分（只显示非 0 项）
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload[0]) return null;
    const point = payload[0].payload; // { day, date, actual, plan } 或 { date, value, plan }
    const unit = dataType === 'labor' ? '人' : '元';
    const breakdown = selectedJobType === 'all' ? getBreakdownByDate(point.date) : [];
    
    // 处理不同的数据结构
    const displayDate = point.day ? `${point.day} (${point.date})` : point.date;
    const planValue = point.plan || point.value;
    const actualValue = point.actual || point.value;
    
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: breakdown.length > 0 ? 8 : 6 }}>{displayDate}</div>
        {breakdown.length === 0 && (
          <>
            <div style={{ color: '#6b7280', marginBottom: 4 }}>计划：{dataType === 'labor' ? `${planValue}${unit}` : `¥${Number(planValue).toLocaleString()}`}</div>
            <div style={{ color: '#2563eb' }}>实际：{dataType === 'labor' ? `${actualValue}${unit}` : `¥${Number(actualValue).toLocaleString()}`}</div>
          </>
        )}
        {breakdown.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 6, maxHeight: 220, overflowY: 'auto' }}>
            {breakdown.map((row, index) => {
              const isOverPlan = row.actualValue > row.planValue;
              return (
                <div key={`${point.date}-${row.jobType}`} style={{ fontSize: 12, lineHeight: '18px', padding: '4px 0', borderBottom: index < breakdown.length - 1 ? '1px solid #f8f9fa' : 'none' }}>
                  <div style={{ color: '#374151', fontWeight: 500, marginBottom: 2 }}>{row.jobType}</div>
                  <div style={{ color: '#6b7280', marginBottom: 1 }}>计划: {dataType === 'labor' ? `${row.planValue}${unit}` : `¥${Number(row.planValue).toLocaleString()}`}</div>
                  <div style={{ color: '#2563eb', marginBottom: isOverPlan ? 4 : 0 }}>实际: {dataType === 'labor' ? `${row.actualValue}${unit}` : `¥${Number(row.actualValue).toLocaleString()}`}</div>
                  {isOverPlan && (
                    <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                      异常原因: 加班
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-24">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedJobType} onValueChange={(value) => setSelectedJobType(value as keyof typeof jobTypes)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* 总是显示"全部工种"选项 */}
              <SelectItem key="all" value="all">
                {jobTypes.all.name}
              </SelectItem>
              {/* 只显示有数据的工种 */}
              {getAvailableJobTypes().map((jobType) => (
                <SelectItem key={jobType} value={jobType}>
                  {jobTypes[jobType as keyof typeof jobTypes]?.name || jobType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* 视图切换 - 类似截图的tab样式 */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'calendar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              月视图
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'weekly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              周视图
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <TableIcon className="h-4 w-4" />
              全部数据
            </button>
          </div>
        </div>
        
        {/* 操作按钮 */}
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
                    录入数据
                  </Button>
                    </div>


      {/* 主内容区域 */}
      {viewMode === 'table' ? (
        <>
              <div className="rounded-md border">
                <div className="overflow-auto max-h-[calc(100vh-400px)]">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>实际{dataType === 'labor' ? '人数' : '费用'}</TableHead>
                      <TableHead>计划{dataType === 'labor' ? '人数' : '费用'}</TableHead>
                      <TableHead>差异</TableHead>
                      <TableHead>完成率</TableHead>
                      <TableHead className="w-28">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item, index) => {
                      const variance = item.value - item.plan;
                      const completionRate = ((item.value / item.plan) * 100).toFixed(1);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.date}</TableCell>
                          <TableCell>
                            {dataType === 'labor' ? `${item.value}人` : `¥${item.value.toLocaleString()}`}
                          </TableCell>
                          <TableCell>
                            {dataType === 'labor' ? `${item.plan.toFixed(1)}人` : `¥${item.plan.toLocaleString()}`}
                          </TableCell>
                          <TableCell className={getVarianceColor(item.value, item.plan, item.originalValue)}>
                            {variance > 0 ? '+' : ''}{dataType === 'labor' ? `${variance.toFixed(1)}人` : `¥${variance.toLocaleString()}`}
                          </TableCell>
                          <TableCell>
                            <span className={getVarianceColor(item.value, item.plan, item.originalValue)}>
                              {completionRate}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => setDetailForDate(item.date)}>
                              查看详情
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              </div>

              {/* 分页 */}
              <div className="flex items-center justify-between mt-4 bg-white">
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
          ) : viewMode === 'calendar' ? (
            <div className="rounded-md border p-6 space-y-4">
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
                  const breakdown = selectedJobType === 'all' && day.data ? getBreakdownByDate(day.dateStr) : [];
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 min-h-[80px] rounded cursor-pointer transition-all relative group ${
                        day.isCurrentMonth ? colorClass : 'bg-gray-50 text-gray-400'
                      }`}
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
                    </div>
                      )}
                      
                      {/* 自定义 Tooltip */}
                      {day.data && breakdown.length > 0 && (
                        <div className="absolute z-50 invisible group-hover:visible bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px] top-full left-1/2 transform -translate-x-1/2 mt-1">
                          <div className="text-sm font-medium text-gray-900 mb-2">
                            {day.dateStr}
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {breakdown.map((row, idx) => {
                              const isOverPlan = row.actualValue > row.planValue;
                              return (
                                <div key={`${day.dateStr}-${row.jobType}`} className="border-b border-gray-100 last:border-b-0 pb-2 last:pb-0">
                                  <div className="text-xs font-medium text-gray-700 mb-1">{row.jobType}</div>
                                  <div className="text-xs text-gray-500 mb-0.5">
                                    计划: {dataType === 'labor' ? `${row.planValue}人` : `¥${Number(row.planValue).toLocaleString()}`}
                                  </div>
                                  <div className="text-xs text-category-blue-600 mb-1">
                                    实际: {dataType === 'labor' ? `${row.actualValue}人` : `¥${Number(row.actualValue).toLocaleString()}`}
                                  </div>
                                  {isOverPlan && (
                                    <div className="text-xs text-category-red-600 bg-category-red-50 px-2 py-1 rounded">
                                      异常原因: 加班
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                      </div>
                    </div>
                      )}
                  </div>
                  );
                })}
                </div>

            </div>
          ) : viewMode === 'weekly' ? (
            <div className="rounded-md border p-6 space-y-4">
              {/* 周导航 */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(selectedDate.getDate() - 7);
                    setSelectedDate(newDate);
                  }}
                >
                  ← 上周
                </Button>
                <h3 className="text-lg font-semibold">
                      {(() => {
                    const weekStart = new Date(selectedDate);
                    weekStart.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
                  })()}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(selectedDate.getDate() + 7);
                    setSelectedDate(newDate);
                  }}
                >
                  下周 →
                </Button>
                      </div>
              
              {/* 周视图柱状图 */}
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getWeeklyData()} barCategoryGap="10%">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => dataType === 'labor' ? `${value}人` : `¥${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                    <Bar 
                      dataKey="plan" 
                      fill="hsl(0, 0%, 70%)" 
                      name="计划"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={40}
                    >
                      <LabelList 
                        dataKey="plan" 
                        position="top" 
                        formatter={(value) => dataType === 'labor' ? `${value}人` : `¥${value.toLocaleString()}`}
                        style={{ fontSize: '12px', fill: 'hsl(0, 0%, 50%)' }}
                      />
                    </Bar>
                    <Bar 
                      dataKey="actual" 
                      fill="hsl(210, 70%, 65%)" 
                      name="实际"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={40}
                    >
                      <LabelList 
                        dataKey="actual" 
                        position="top" 
                        formatter={(value) => dataType === 'labor' ? `${value}人` : `¥${value.toLocaleString()}`}
                        style={{ fontSize: '12px', fill: 'hsl(210, 70%, 45%)' }}
                      />
                    </Bar>
                  </BarChart>
                      </ResponsiveContainer>
                  </div>
              
              {/* 周视图统计信息 */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xl font-bold text-category-blue-600">
                    {getWeeklyData().reduce((sum, day) => sum + day.actual, 0)}
                </div>
                  <div className="text-muted-foreground">本周实际{dataType === 'labor' ? '人数' : '费用'}</div>
              </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-category-purple-600">
                    {getWeeklyData().reduce((sum, day) => sum + day.plan, 0)}
      </div>
                  <div className="text-muted-foreground">本周计划{dataType === 'labor' ? '人数' : '费用'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-category-green-600">
                    {getWeeklyData().filter(day => day.hasData).length}
                  </div>
                  <div className="text-muted-foreground">有数据天数</div>
                </div>
              </div>
            </div>
          ) : null}

      {/* 数据录入对话框 */}
      {isDataEntryOpen && (
        <DataEntryForm
          open={isDataEntryOpen}
          onOpenChange={setIsDataEntryOpen}
          onSubmit={handleDataEntrySubmit}
          title={currentEntryContext?.title}
          unit={currentEntryContext?.unit}
          description={currentEntryContext?.description}
          category={currentEntryContext?.category}
        />
      )}

      {/* 全部数据-查看详情（分工种明细） */}
      <Dialog open={!!detailForDate} onOpenChange={(open) => setDetailForDate(open ? detailForDate : null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>分工种明细 - {detailForDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {(() => {
              if (!detailForDate) return null;
              const rows = getBreakdownByDate(detailForDate);
              if (!rows || rows.length === 0) {
                return <div className="text-sm text-muted-foreground">该日无分工种数据</div>;
              }
              return (
                <div className="divide-y">
                  {rows.map((row: any) => (
                    <div key={`${detailForDate}-${row.jobType}`} className="py-2">
                      <div className="text-sm font-medium text-gray-900 mb-1">{row.jobType}</div>
                      <div className="text-xs text-gray-500 mb-0.5">
                        计划：{dataType === 'labor' ? `${row.planValue}人` : `¥${Number(row.planValue).toLocaleString()}`}
                      </div>
                      <div className="text-xs text-category-blue-600">
                        实际：{dataType === 'labor' ? `${row.actualValue}人` : `¥${Number(row.actualValue).toLocaleString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}