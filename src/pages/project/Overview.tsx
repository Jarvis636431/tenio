import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProjectCoreGraph } from "@/hooks/useProjectCoreGraph";
import { useProjectHighlight } from "@/hooks/useProjectHighlight";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/hooks/useAuth";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import { useProjectExport } from "@/pages/project/hooks/useProjectExport";
import { ProjectHeader } from "@/pages/project/components/ProjectHeader";
import { ModelViewer } from "@/components/model/ModelViewer";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GanttChart } from "@/components/plan/gantt/GanttChart";
import { NetworkDiagram } from "@/components/plan/network/NetworkDiagram";
import { getProjectCostCurve, getProjectHeadcountCurve } from "@/services/schedulepro-service";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlanTask } from "@/types/domain/plan";

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
  const { coreGraph, isLoading: isGraphLoading } = useProjectCoreGraph();
  const { config } = useProjectConfig();
  const { currentProject, projects } = useProject();
  const { token } = useAuth();
  const { handleExportCSV } = useProjectExport(coreGraph);
  const { tagMap, processHighlights, allResolvedIds, getIdsByDate } =
    useProjectHighlight(projectId);
  const [currentDay, setCurrentDay] = useState(1);
  const fixedHighlightIds = useMemo(
    () => [
      "2j0dIGQjb7IBS38pr73$QB",
      "2j0dIGQjb7IBS38pr73yHp",
      "2j0dIGQjb7IBS38pr73yUZ",
      "2j0dIGQjb7IBS38pr73yUc",
      "2j0dIGQjb7IBS38pr73yUd",
      "2j0dIGQjb7IBS38pr732e1",
    ],
    [],
  );

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

  const planTasks = useMemo<PlanTask[]>(() => {
    if (!coreGraph?.work_processes?.length) return [];
    const depsByTarget = new Map<string, string[]>();
    coreGraph.dependencies?.forEach((dep) => {
      const toId = dep.to_work_process_id ?? dep.successor_id;
      const fromId = dep.from_work_process_id ?? dep.predecessor_id;
      if (!toId || !fromId) return;
      const list = depsByTarget.get(toId) ?? [];
      list.push(fromId);
      depsByTarget.set(toId, list);
    });

    const resolvePlannedRange = (wp: typeof coreGraph.work_processes[number]) => {
      const exec = wp.execution_state;
      if (!exec) return { start: "", end: "" };
      const start = exec.planned_start_datetime ?? "";
      const end = exec.planned_end_datetime ?? "";
      if (start && end) return { start, end };
      const intervals = exec.planned_intervals ?? [];
      if (intervals.length === 0) return { start, end };
      const starts = intervals
        .map((item) => new Date(item.start_datetime).getTime())
        .filter((value) => !Number.isNaN(value));
      const ends = intervals
        .map((item) => new Date(item.end_datetime).getTime())
        .filter((value) => !Number.isNaN(value));
      if (!starts.length || !ends.length) return { start, end };
      return {
        start: new Date(Math.min(...starts)).toISOString(),
        end: new Date(Math.max(...ends)).toISOString(),
      };
    };

    return coreGraph.work_processes.map((wp) => {
      const exec = wp.execution_state;
      const { start, end } = resolvePlannedRange(wp);
      const workerCount = wp.team_size ?? wp.suggested_team_count ?? 0;
      const jobType = wp.trade?.name ?? "";
      return {
        id: wp.id,
        seqNo: wp.seq_no,
        task: wp.name || wp.code || "未命名工序",
        workerCount,
        jobType,
        totalCost:
          (wp.labor_cost ?? 0) +
          (wp.material_cost ?? 0) +
          (wp.device_rental_cost ?? 0),
        startTime: start,
        endTime: end,
        constructionSituation: exec?.status ?? "",
        prerequisiteProcess: (depsByTarget.get(wp.id) ?? []).join(", "),
        quantity: wp.quantity ?? 0,
        quantityUnit: wp.unit ?? "",
        overtime: "否",
        duration: wp.duration_days ? `${wp.duration_days}天` : "",
        actualWorkDays: wp.duration_days ?? 0,
        constructionMethod: wp.selected_method?.name ?? "",
        directDependency: "",
        remarks: "",
        selectedConstructionMethod: wp.selected_method?.name ?? "",
        materialCost: wp.material_cost ?? 0,
        laborCost: wp.labor_cost ?? 0,
        floor: 0,
        criticalPath: exec?.critical_path ?? false,
        worker: jobType,
        count: workerCount,
        startDate: start,
        endDate: end,
      };
    });
  }, [coreGraph]);

  const headcountCurveQuery = useQuery({
    queryKey: ["overview", "headcount-curve", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) {
        throw new Error("缺少项目 ID");
      }
      return getProjectHeadcountCurve(currentProject.id, token || undefined);
    },
    enabled: Boolean(currentProject?.id && token),
    refetchOnWindowFocus: false,
  });

  const costCurveQuery = useQuery({
    queryKey: ["overview", "cost-curve", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) {
        throw new Error("缺少项目 ID");
      }
      return getProjectCostCurve(currentProject.id, token || undefined);
    },
    enabled: Boolean(currentProject?.id && token),
    refetchOnWindowFocus: false,
  });

  const headcountChartData = useMemo(() => {
    const points = headcountCurveQuery.data?.points ?? [];
    return points.map((point) => ({
      date: point.date,
      劳动力人数: point.headcount,
    }));
  }, [headcountCurveQuery.data]);

  const costCurveChartData = useMemo(() => {
    const points = costCurveQuery.data?.points ?? [];
    return points.map((point) => ({
      date: point.date,
      总成本: point.total_cost,
    }));
  }, [costCurveQuery.data]);

  const chartColors = ["#2563eb", "#16a34a", "#db2777", "#ea580c", "#8b5cf6", "#0891b2"];

  const renderChart = (
    data: Record<string, string | number>[],
    seriesNames: string[],
    unit: string,
  ) => {
    if (!data || data.length === 0) return null;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => (unit ? `${value}${unit}` : `${value}`)}
          />
          <Tooltip />
          {seriesNames.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={chartColors[index % chartColors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const currentProjectName = useMemo(() => {
    if (!projectId) return currentProject?.name || "项目详情";
    return (
      projects.find((project) => project.id === projectId)?.name ||
      currentProject?.name ||
      "项目详情"
    );
  }, [projectId, projects, currentProject]);

  const totalDurationLabel = useMemo(() => {
    if (!coreGraph?.work_processes?.length) return "";
    const times = coreGraph.work_processes
      .map((wp) => ({
        start: wp.execution_state?.planned_start_datetime,
        end: wp.execution_state?.planned_end_datetime,
      }))
      .filter((t) => t.start && t.end) as Array<{ start: string; end: string }>;
    if (!times.length) return "";
    const starts = times
      .map((t) => new Date(t.start).getTime())
      .filter((v) => !Number.isNaN(v));
    const ends = times
      .map((t) => new Date(t.end).getTime())
      .filter((v) => !Number.isNaN(v));
    if (!starts.length || !ends.length) return "";
    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    const totalDays = Math.max(
      1,
      Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)) + 1,
    );
    return `${totalDays}天`;
  }, [coreGraph]);

  const onsiteCount = useMemo(() => {
    if (!coreGraph?.work_processes?.length) return undefined;
    const now = Date.now();
    const activeWorkProcesses = coreGraph.work_processes.filter((wp) => {
      const start = wp.execution_state?.planned_start_datetime
        ? new Date(wp.execution_state.planned_start_datetime).getTime()
        : NaN;
      const end = wp.execution_state?.planned_end_datetime
        ? new Date(wp.execution_state.planned_end_datetime).getTime()
        : NaN;
      if (Number.isNaN(start) || Number.isNaN(end)) return false;
      return now >= start && now <= end;
    });
    if (!activeWorkProcesses.length) return 0;
    return activeWorkProcesses.reduce(
      (sum, wp) => sum + (wp.team_size ?? wp.suggested_team_count ?? 0),
      0,
    );
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

  const selectedTimelineDate = useMemo(() => {
    if (!timeRange) return null;
    const selected = new Date(timeRange.baseDate);
    selected.setDate(timeRange.baseDate.getDate() + currentDay - 1);
    selected.setHours(12, 0, 0, 0);
    return selected;
  }, [currentDay, timeRange]);

  const selectedTimelineDateLabel = useMemo(() => {
    if (!selectedTimelineDate) return "";
    const y = selectedTimelineDate.getFullYear();
    const m = String(selectedTimelineDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedTimelineDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [selectedTimelineDate]);

  const highlightInfo = useMemo(() => {
    const ids = allResolvedIds;
    return {
      highlightCount: ids.length,
      highlightIds: ids,
    };
  }, [allResolvedIds]);

  // 根据当前天数计算工序状态
  const taskStatusByTime = useMemo(() => {
    if (!selectedTimelineDate) return { completed: [], inProgress: [], upcoming: [] };
    const currentDate = selectedTimelineDate;

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
  }, [processHighlights, selectedTimelineDate]);

  const completedIds = useMemo(() => {
    if (!selectedTimelineDate) return [] as string[];
    const result = getIdsByDate(selectedTimelineDate);
    console.debug("[overview] highlightByDate", {
      day: currentDay,
      completed: result.completedIds.length,
      inProgress: result.inProgressIds.length,
      debug: result.debug,
    });
    return result.completedIds;
  }, [currentDay, getIdsByDate, selectedTimelineDate]);
  
  const inProgressIds = useMemo(() => {
    if (!selectedTimelineDate) return [] as string[];
    const result = getIdsByDate(selectedTimelineDate);
    console.debug("[overview] highlightByDate inProgress", {
      day: currentDay,
      inProgress: result.inProgressIds.length,
      debug: result.debug,
    });
    return result.inProgressIds;
  }, [currentDay, getIdsByDate, selectedTimelineDate]);

  const dailyProcesses = useMemo(() => {
    if (!selectedTimelineDate) return [];
    return processHighlights
      .filter((item) => {
        if (!item.start || !item.end) return false;
        const start = new Date(item.start);
        const end = new Date(item.end);
        start.setHours(12, 0, 0, 0);
        end.setHours(12, 0, 0, 0);
        return selectedTimelineDate >= start && selectedTimelineDate <= end;
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
      }));
  }, [processHighlights, selectedTimelineDate]);


  // 初始化当前天数为项目开始天数
  useEffect(() => {
    if (timeRange && currentDay === 1) {
      setCurrentDay(timeRange.startDay);
    }
  }, [timeRange]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0">
        <ProjectHeader
          title={currentProjectName}
          titleExtra={totalDurationLabel ? `总工期：${totalDurationLabel}` : undefined}
          onsiteCount={onsiteCount}
          onExportReport={handleExportCSV}
        />

        {timeRange && (
          <Card className="mt-4">
            <CardContent className="p-0">
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
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-10 gap-2 overflow-hidden">
        <div className="col-span-7 min-w-0 grid min-h-0 grid-rows-[0.75fr_0.75fr_1.25fr] gap-2 overflow-hidden">
          <div className="grid min-h-0 min-w-0 grid-cols-1 gap-2 lg:grid-cols-2">
            <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-medium">人员投入趋势</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
                {headcountCurveQuery.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : headcountCurveQuery.isError ? (
                  <div className="flex h-full items-center justify-center text-sm text-destructive">
                    无法获取人员数据
                  </div>
                ) : headcountChartData.length > 0 ? (
                  <div className="h-full w-full">{renderChart(headcountChartData, ["劳动力人数"], "人")}</div>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    暂无人员数据
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-medium">资金成本趋势</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
                {costCurveQuery.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : costCurveQuery.isError ? (
                  <div className="flex h-full items-center justify-center text-sm text-destructive">
                    无法获取成本数据
                  </div>
                ) : costCurveChartData.length > 0 ? (
                  <div className="h-full w-full">{renderChart(costCurveChartData, ["总成本"], "万元")}</div>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    暂无成本数据
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid min-h-0 min-w-0 grid-cols-1 gap-2 lg:grid-cols-2">
            <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-medium">甘特图</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
                {planTasks.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    当前项目暂无施工任务数据
                  </div>
                ) : (
                  <div className="h-full min-h-0 overflow-hidden">
                    <GanttChart
                      data={planTasks}
                      scale="day"
                      shutdownEvents={config?.shutdown_events ?? []}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-medium">网络图</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
                {planTasks.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    当前项目暂无施工任务数据
                  </div>
                ) : (
                  <div className="h-full min-h-0 overflow-hidden">
                    <NetworkDiagram tasks={planTasks} currentDate={selectedTimelineDate} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-medium">模型预览</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              <div className="flex h-full min-h-0 flex-col gap-2">
                <div className="flex items-center justify-between">
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

                <div className="relative min-h-0 flex-1 w-full">
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
                      {
                        ids: fixedHighlightIds,
                        color: "#000000",
                        opacity: 0.05,
                        customID: "fixed",
                      },
                    ]}
                    className="h-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-3 min-w-0 flex h-full min-h-0 flex-col overflow-hidden">
          <CardHeader className="p-2 pb-1">
            <CardTitle className="text-xs font-medium">当日工序</CardTitle>
            <CardDescription className="text-xs">
              {selectedTimelineDateLabel || "未选择日期"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-2">
                {dailyProcesses.length === 0 ? (
                  <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    暂无当日工序
                  </div>
                ) : (
                  dailyProcesses.map((item, index) => (
                    <div key={item.id} className="rounded-md border bg-muted/20 p-2">
                      <div className="text-[11px] text-muted-foreground">
                        工序 {index + 1}
                      </div>
                      <div className="text-xs leading-5">{item.name}</div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
