import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, TrendingUp, Users, DollarSign } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { useProjectSchedule } from "@/hooks/useProjectSchedule";
import { ModelViewer } from "@/components/ModelViewer";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectHomepageProps {
  projectId: string;
  projectName: string;
}

export function ProjectHomepage({
  projectId,
}: ProjectHomepageProps) {
  const {
    scheduleItems,
    isLoading,
    error,
    processGuidMapping,
    forceRefreshMapping,
    isMappingFetching,
  } = useProjectSchedule();
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartDataType, setChartDataType] = useState<'cost' | 'labor'>('cost');

  const highlightInfo = useMemo(() => {
    const all: Array<number | string> = [];
    scheduleItems.forEach((i) => {
      const raw = processGuidMapping?.[i.task] as unknown;
      const arr = Array.isArray(raw) ? raw : [];
      arr.forEach((id) => {
        if (typeof id === "number" && Number.isFinite(id)) {
          all.push(id);
        } else if (typeof id === "string") {
          const trimmed = id.trim();
          if (!trimmed) return;
          all.push(trimmed);
        }
      });
    });

    return {
      highlightCount: all.length,
      highlightIds: all,
    };
  }, [scheduleItems, processGuidMapping]);

  const sanitizeIds = (
    ids: Array<number | string> | undefined
  ): Array<number | string> => {
    const arr = Array.isArray(ids) ? ids : [];
    const out: Array<number | string> = [];
    arr.forEach((id) => {
      if (typeof id === "number" && Number.isFinite(id)) {
        out.push(id);
      } else if (typeof id === "string") {
        const t = id.trim();
        if (!t) return;
        if (/^\d+$/.test(t)) {
          const n = parseInt(t, 10);
          if (!Number.isNaN(n)) out.push(n);
        } else {
          out.push(t);
        }
      }
    });
    return out;
  };

  const orderedTasks = useMemo(
    () => scheduleItems.map((i) => i.task),
    [scheduleItems]
  );
  const completedIds = useMemo(() => {
    return orderedTasks
      .slice(0, Math.max(0, activeIndex))
      .flatMap((name) => sanitizeIds(processGuidMapping?.[name]));
  }, [orderedTasks, activeIndex, processGuidMapping]);
  const inProgressIds = useMemo(
    () => sanitizeIds(processGuidMapping?.[orderedTasks[activeIndex]]),
    [orderedTasks, activeIndex, processGuidMapping]
  );

  // 图表数据处理
  const chartData = useMemo(() => {
    return scheduleItems.map((item, index) => {
      // 生成模拟的费用和劳动力数据（实际项目中应该从真实数据源获取）
      const baseCost = (item.workerCount || 1) * 500; // 基础费用
      const variationFactor = 0.8 + Math.sin(index * 0.5) * 0.4; // 添加一些变化
      const cost = Math.round(baseCost * variationFactor);
      
      const laborCount = item.workerCount || Math.floor(Math.random() * 10) + 1;
      
      return {
        name: item.task.length > 15 ? item.task.substring(0, 15) + '...' : item.task,
        fullName: item.task,
        cost: cost,
        labor: laborCount,
        index: index + 1
      };
    });
  }, [scheduleItems]);

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
  const CustomTooltip = ({ active, payload, label }: any) => {
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

  useEffect(() => {
    const withIds = scheduleItems
      .map((i) => ({
        task: i.task,
        ids: Array.isArray(processGuidMapping?.[i.task])
          ? (processGuidMapping?.[i.task] as Array<number | string>)
          : [],
      }))
      .filter(({ ids }) => {
        const arr = Array.isArray(ids) ? ids : [];
        return arr.some((id) => {
          if (typeof id === "number") return Number.isFinite(id);
          if (typeof id === "string") return id.trim().length > 0;
          return false;
        });
      });
    if (withIds.length > 0) {
      console.log("[ProjectHomepage] 工序含有映射ID:", withIds);
    }
  }, [scheduleItems, processGuidMapping]);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">项目ID: {projectId}</p>
          {isLoading && <p className="text-gray-500">数据加载中...</p>}
          {error && (
            <p className="text-destructive">加载失败：{error.message}</p>
          )}
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => forceRefreshMapping()}
            disabled={isMappingFetching}
          >
            <RefreshCcw />
            强制刷新映射
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
                工序位置：{activeIndex + 1} / {orderedTasks.length}
              </div>
              <div className="text-sm">
                <span className="mr-3">
                  进行中：{inProgressIds.length} 构件
                </span>
                <span>已完成：{completedIds.length} 构件</span>
                <span className="ml-3 text-muted-foreground">
                  高亮构件：{highlightInfo.highlightCount}
                </span>
              </div>
            </div>
            <Slider
              value={[
                Math.min(activeIndex, Math.max(0, orderedTasks.length - 1)),
              ]}
              min={0}
              max={Math.max(0, orderedTasks.length - 1)}
              step={1}
              onValueChange={(v) =>
                setActiveIndex(Array.isArray(v) ? v[0] ?? 0 : 0)
              }
            />

            <div className="relative w-full h-[500px]">
              <ModelViewer
                src="/models/0923.ifc"
                highlightGroups={[
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
