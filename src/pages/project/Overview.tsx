import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useProjectCoreGraph } from "@/hooks/useProjectCoreGraph";
import { useProjectHighlight } from "@/hooks/useProjectHighlight";
import { ModelViewer } from "@/components/model/ModelViewer";
import { Slider } from "@/components/ui/slider";

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
    currentDate.setHours(12, 0, 0, 0);

    const completed: string[] = [];
    const inProgress: string[] = [];
    const upcoming: string[] = [];

    processHighlights.forEach((item) => {
      if (!item.start || !item.end) return;
      const start = new Date(item.start);
      const end = new Date(item.end);
      start.setHours(12, 0, 0, 0);
      end.setHours(12, 0, 0, 0);

      if (currentDate < start) {
        upcoming.push(item.name);
      } else if (currentDate > end) {
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
    const result = getIdsByDate(currentDate);
    console.debug("[overview] highlightByDate", {
      day: currentDay,
      completed: result.completedIds.length,
      inProgress: result.inProgressIds.length,
      debug: result.debug,
    });
    return result.completedIds;
  }, [currentDay, getIdsByDate, timeRange]);
  
  const inProgressIds = useMemo(() => {
    if (!timeRange) return [] as string[];
    const base = timeRange.baseDate;
    const currentDate = new Date(base);
    currentDate.setDate(base.getDate() + currentDay - 1);
    const result = getIdsByDate(currentDate);
    console.debug("[overview] highlightByDate inProgress", {
      day: currentDay,
      inProgress: result.inProgressIds.length,
      debug: result.debug,
    });
    return result.inProgressIds;
  }, [currentDay, getIdsByDate, timeRange]);


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
                    src: "/models/0202.ifc",
                    tagMap,
                  },
                ]}
                baseMaterialOverrides={{ transparent: true, opacity: 0 }}
                highlightColorGroups={[
                  {
                    ids: completedIds,
                    color: "#22c55e",
                    opacity: 0.18,
                    customID: "completed",
                  },
                  {
                    ids: inProgressIds,
                    color: "#f59e0b",
                    opacity: 1,
                    customID: "inProgress",
                  },
                ]}
                className="h-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
