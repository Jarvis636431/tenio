import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, TrendingUp, Users, DollarSign } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useProjectCoreGraph } from "@/hooks/useProjectCoreGraph";
import { useProjectHighlight } from "@/hooks/useProjectHighlight";
import { ModelViewer } from "@/components/model/ModelViewer";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OverviewProps {
  projectId?: string;
  projectName?: string;
}

export function Overview({
  projectId: propsProjectId,
}: OverviewProps = {}) {
  const { id: paramProjectId } = useParams();
  // 优先使用路由参数，其次使用props
  const projectId = paramProjectId || propsProjectId || '';
  const { coreGraph, isLoading } = useProjectCoreGraph();
  const { tagMap, processHighlights, resolveExpressIds, allResolvedIds, getIdsByDate } =
    useProjectHighlight(projectId);
  const [currentDay, setCurrentDay] = useState(1);
  const [chartDataType, setChartDataType] = useState<'cost' | 'labor'>('cost');

  const tasks = useMemo(() => {
    if (!coreGraph?.work_processes?.length) return [];
    return coreGraph.work_processes.map((wp) => {
      const exec = wp.execution_state;
      const start = exec?.planned_start_datetime ?? "";
      const end = exec?.planned_end_datetime ?? "";
      return {
        id: wp.id,
        name: wp.name || wp.code || "未命名工序",
        start,
        end,
        durationDays: wp.duration_days ?? 0,
        laborCost: wp.labor_cost ?? 0,
        materialCost: wp.material_cost ?? 0,
        deviceCost: wp.device_rental_cost ?? 0,
        teamSize: wp.team_size ?? wp.suggested_team_count ?? 0,
        status: exec?.status ?? "planned",
        expressIds: wp.express_ids ?? [],
        tagIds: wp.tag ?? [],
      };
    });
  }, [coreGraph]);

  // 计算项目时间范围 - 处理相对时间
  const timeRange = useMemo(() => {
    if (!processHighlights.length) return null;
    const starts = processHighlights.map((t) => t.start).filter(Boolean) as Date[];
    const ends = processHighlights.map((t) => t.end).filter(Boolean) as Date[];
    if (!starts.length || !ends.length) return null;
    const minStart = new Date(Math.min(...starts.map((d) => d.getTime())));
    const maxEnd = new Date(Math.max(...ends.map((d) => d.getTime())));
    const totalDays = Math.max(
      1,
      Math.ceil((maxEnd.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );
    return { startDay: 1, endDay: totalDays, totalDays, baseDate: minStart };
  }, [processHighlights]);

  const highlightInfo = useMemo(() => {
    const ids = allResolvedIds;
    return {
      highlightCount: ids.length,
      highlightIds: ids,
    };
  }, [allResolvedIds]);

  // 根据当前天数计算工序状态
  const taskStatusByTime = useMemo(() => {
    if (!timeRange) return { completed: [], inProgress: [], upcoming: [] };
    const base = timeRange.baseDate;
    const currentDate = new Date(base);
    currentDate.setDate(base.getDate() + currentDay - 1);

    const completed: string[] = [];
    const inProgress: string[] = [];
    const upcoming: string[] = [];

    processHighlights.forEach((item) => {
      if (!item.start || !item.end) return;
      if (currentDate < item.start) {
        upcoming.push(item.name);
      } else if (currentDate > item.end) {
        completed.push(item.name);
      } else {
        inProgress.push(item.name);
      }
    });

    return { completed, inProgress, upcoming };
  }, [processHighlights, currentDay, timeRange]);

  const completedIds = useMemo(() => {
    if (!timeRange) return [] as string[];
    const base = timeRange.baseDate;
    const currentDate = new Date(base);
    currentDate.setDate(base.getDate() + currentDay - 1);
    return getIdsByDate(currentDate).completedIds;
  }, [currentDay, getIdsByDate, timeRange]);
  
  const inProgressIds = useMemo(() => {
    if (!timeRange) return [] as string[];
    const base = timeRange.baseDate;
    const currentDate = new Date(base);
    currentDate.setDate(base.getDate() + currentDay - 1);
    return getIdsByDate(currentDate).inProgressIds;
  }, [currentDay, getIdsByDate, timeRange]);

  // 图表数据处理
  const chartData = useMemo(() => {
    return tasks.map((item, index) => {
      const cost =
        (item.laborCost ?? 0) + (item.materialCost ?? 0) + (item.deviceCost ?? 0);
      const laborCount = item.teamSize || 0;
      return {
        name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
        fullName: item.name,
        cost,
        labor: laborCount,
        index: index + 1,
      };
    });
  }, [tasks]);

  // 图表统计数据
  const chartStats = useMemo(() => {
    const totalCost = chartData.reduce((sum, item) => sum + item.cost, 0);
    const totalLabor = chartData.reduce((sum, item) => sum + item.labor, 0);
    const avgCost = chartData.length > 0 ? Math.round(totalCost / chartData.length) : 0;
    const avgLabor = chartData.length > 0 ? Math.round(totalLabor / chartData.length) : 0;
    
    return {
      totalCost,
      totalLabor,
      avgCost,
      avgLabor,
      processCount: chartData.length
    };
  }, [chartData]);

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.fullName}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <span className="inline-flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                费用: ¥{data.cost.toLocaleString()}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              <span className="inline-flex items-center">
                <Users className="h-3 w-3 mr-1" />
                劳动力: {data.labor}人
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // 初始化当前天数为项目开始天数
  useEffect(() => {
    if (timeRange && currentDay === 1) {
      setCurrentDay(timeRange.startDay);
    }
  }, [timeRange]);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">项目ID: {projectId}</p>
          {isLoading && <p className="text-gray-500">数据加载中...</p>}
        </div>
        <div>
          <Button variant="outline" size="sm" disabled>
            <RefreshCcw />
            核心数据已加载
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>模型预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {timeRange ? (
                  <>
                    项目周期：第 {timeRange.startDay} 天 - 第 {timeRange.endDay} 天 (共 {timeRange.totalDays} 天)
                    <br />
                    当前进度：第 {currentDay} 天
                    {tasks.some((item) => !item.start || !item.end) && (
                      <>
                        <br />
                        <span className="text-amber-600">⚠️ 部分工序缺少时间数据</span>
                      </>
                    )}
                  </>
                ) : (
                  '正在加载时间数据...'
                )}
              </div>
              <div className="text-sm">
                <span className="mr-3">
                  进行中：{inProgressIds.length} 构件 ({taskStatusByTime.inProgress.length} 工序)
                </span>
                <span>已完成：{completedIds.length} 构件 ({taskStatusByTime.completed.length} 工序)</span>
                <span className="ml-3 text-muted-foreground">
                  高亮构件：{highlightInfo.highlightCount}
                </span>
              </div>
            </div>
            
            {timeRange && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">项目进度控制</div>
                  <div className="text-xs text-muted-foreground">
                    拖动滑块查看不同天数的施工状态
                  </div>
                </div>
                <Slider
                  value={[currentDay]}
                  min={timeRange.startDay}
                  max={timeRange.endDay}
                  step={1}
                  onValueChange={(v) => setCurrentDay(v[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>第 {timeRange.startDay} 天</span>
                  <span>第 {timeRange.endDay} 天</span>
                </div>
              </div>
            )}

            <div className="relative w-full h-[500px]">
              <ModelViewer
                models={[
                  {
                    key: "default",
                    src: "/models/0125.ifc",
                    tagMap,
                  },
                ]}
                highlightColorGroups={[
                  {
                    ids: completedIds,
                    color: "#22c55e",
                    opacity: 0.8,
                    customID: "completed",
                  },
                  {
                    ids: inProgressIds,
                    color: "#f59e0b",
                    opacity: 0.9,
                    customID: "inProgress",
                  },
                ]}
                className="h-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 工序费用/劳动力趋势图 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              工序趋势分析
            </CardTitle>
            <Select value={chartDataType} onValueChange={(value: 'cost' | 'labor') => setChartDataType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost">费用</SelectItem>
                <SelectItem value="labor">劳动力</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">总费用</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">¥{chartStats.totalCost.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">总劳动力</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{chartStats.totalLabor}人</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">平均费用</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">¥{chartStats.avgCost.toLocaleString()}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">平均劳动力</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">{chartStats.avgLabor}人</p>
              </div>
            </div>

            {/* 折线图 */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="index" 
                    tick={{ fontSize: 12 }}
                    height={40}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => 
                      chartDataType === 'cost' 
                        ? `¥${(value / 1000).toFixed(0)}k` 
                        : `${value}人`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {chartDataType === 'cost' ? (
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                      name="费用 (¥)"
                    />
                  ) : (
                    <Line 
                      type="monotone" 
                      dataKey="labor" 
                      stroke="#16a34a" 
                      strokeWidth={3}
                      dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
                      name="劳动力 (人)"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-sm text-gray-500 text-center">
              共 {chartStats.processCount} 个工序 • 
              {chartDataType === 'cost' ? '费用趋势' : '劳动力趋势'} • 
              点击图例可切换显示内容
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
