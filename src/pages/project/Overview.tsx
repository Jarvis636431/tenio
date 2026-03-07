import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Legend,
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
  const [activePlanView, setActivePlanView] = useState<"gantt" | "network">("gantt");
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
      <ResponsiveContainer width="100%" height={320}>
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
          <Legend />
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
      <div>
        <ProjectHeader
          title={currentProjectName}
          titleExtra={totalDurationLabel ? `总工期：${totalDurationLabel}` : undefined}
          onsiteCount={onsiteCount}
          onExportReport={handleExportCSV}
        />
        <div className="mt-2 text-sm text-muted-foreground">
          项目ID: {projectId} {isGraphLoading ? " · 核心数据加载中..." : ""}
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>施工计划</CardTitle>
              <CardDescription>在同一页面查看甘特图与网络图</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={activePlanView === "gantt" ? "default" : "outline"}
                size="sm"
                onClick={() => setActivePlanView("gantt")}
              >
                甘特图
              </Button>
              <Button
                variant={activePlanView === "network" ? "default" : "outline"}
                size="sm"
                onClick={() => setActivePlanView("network")}
              >
                网络图
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {planTasks.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center text-muted-foreground">
              当前项目暂无施工任务数据
            </div>
          ) : activePlanView === "gantt" ? (
            <div className="h-[520px] overflow-hidden">
              <GanttChart
                data={planTasks}
                scale="day"
                shutdownEvents={config?.shutdown_events ?? []}
              />
            </div>
          ) : (
            <div className="h-[520px] overflow-hidden rounded-md border">
              <NetworkDiagram tasks={planTasks} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>人员投入趋势</CardTitle>
            <CardDescription>展示每日劳动力总人数</CardDescription>
          </CardHeader>
          <CardContent>
            {headcountCurveQuery.isLoading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : headcountCurveQuery.isError ? (
              <div className="flex h-[320px] items-center justify-center text-sm text-destructive">
                无法获取人员数据
              </div>
            ) : headcountChartData.length > 0 ? (
              renderChart(headcountChartData, ["劳动力人数"], "人")
            ) : (
              <div className="flex h-[320px] items-center justify-center text-muted-foreground">
                暂无人员数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>资金成本趋势</CardTitle>
            <CardDescription>监控人工成本与总成本变化</CardDescription>
          </CardHeader>
          <CardContent>
            {costCurveQuery.isLoading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : costCurveQuery.isError ? (
              <div className="flex h-[320px] items-center justify-center text-sm text-destructive">
                无法获取成本数据
              </div>
            ) : costCurveChartData.length > 0 ? (
              renderChart(costCurveChartData, ["总成本"], "万元")
            ) : (
              <div className="flex h-[320px] items-center justify-center text-muted-foreground">
                暂无成本数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
