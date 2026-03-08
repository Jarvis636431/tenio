import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChartLine,
  ListTodo,
  Network,
  Play,
  Users,
} from "lucide-react";
import { useProjectCoreGraph } from "@/hooks/useProjectCoreGraph";
import { useProjectHighlight } from "@/hooks/useProjectHighlight";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/hooks/useAuth";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import { useProjectExport } from "@/pages/project/hooks/useProjectExport";
import { ProjectHeader } from "@/pages/project/components/ProjectHeader";
import { PanelCard } from "@/pages/project/components/PanelCard";
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
  const [playbackRate, setPlaybackRate] = useState<1 | 2 | 4>(1);
  const [dailyProcessTab, setDailyProcessTab] = useState<"plan" | "actual">("plan");
  const [dailyProcessKeyword, setDailyProcessKeyword] = useState("");
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
      总成本: point.total_cost / 10000,
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

  const timelineProgress = useMemo(() => {
    if (!timeRange) return 0;
    const span = Math.max(1, timeRange.endDay - timeRange.startDay);
    return Math.round(((currentDay - timeRange.startDay) / span) * 100);
  }, [currentDay, timeRange]);

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
    const globalSeqMap = new Map<string, string | number>();
    planTasks.forEach((task, index) => {
      globalSeqMap.set(task.id, task.seqNo ?? index + 1);
    });
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
        seqNo: globalSeqMap.get(item.id),
      }));
  }, [planTasks, processHighlights, selectedTimelineDate]);

  const visibleDailyProcesses = dailyProcessTab === "plan" ? dailyProcesses : [];
  const filteredDailyProcesses = useMemo(() => {
    const keyword = dailyProcessKeyword.trim();
    if (!keyword) return visibleDailyProcesses;
    return visibleDailyProcesses.filter((item) => item.name.includes(keyword));
  }, [dailyProcessKeyword, visibleDailyProcesses]);


  // 初始化当前天数为项目开始天数
  useEffect(() => {
    if (timeRange && currentDay === 1) {
      setCurrentDay(timeRange.startDay);
    }
  }, [timeRange]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 bg-gradient-to-b from-[#020a1d] to-[#041332] px-1 pt-0 pb-1 text-slate-100">
      <div className="shrink-0">
        <ProjectHeader
          title={currentProjectName}
          titleExtra={totalDurationLabel ? `总工期：${totalDurationLabel}` : undefined}
          onsiteCount={onsiteCount}
          onExportReport={handleExportCSV}
        />
      </div>

      {timeRange && (
        <div className="shrink-0 px-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-cyan-300/80 transition hover:text-cyan-100"
                onClick={() => setCurrentDay((d) => Math.max(timeRange.startDay, d - 1))}
                aria-label="上一天"
              >
                <Play className="h-3.5 w-3.5 rotate-180" />
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-cyan-300 transition hover:text-cyan-100"
                onClick={() => setCurrentDay((d) => Math.min(timeRange.endDay, d + 1))}
                aria-label="播放下一天"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-cyan-300/80 transition hover:text-cyan-100"
                onClick={() => setCurrentDay((d) => Math.min(timeRange.endDay, d + 1))}
                aria-label="下一天"
              >
                <Play className="h-3.5 w-3.5" />
              </button>

              {[1, 2, 4].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className={`ml-1 inline-flex h-7 min-w-9 items-center justify-center rounded-md px-2 text-[11px] font-medium transition ${
                    playbackRate === rate
                      ? "text-cyan-100"
                      : "text-cyan-300/70 hover:text-cyan-200"
                  }`}
                  onClick={() => setPlaybackRate(rate as 1 | 2 | 4)}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-cyan-200">
              <span>{selectedTimelineDateLabel || "--"}</span>
              <span className="text-cyan-300/70">{timelineProgress}%</span>
            </div>
          </div>

          <div className="mt-2 px-0.5">
            <Slider
              value={[currentDay]}
              min={timeRange.startDay}
              max={timeRange.endDay}
              step={1}
              onValueChange={(v) => setCurrentDay(v[0])}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-cyan-100 [&_[role=slider]]:bg-[#5dd6ff] [&_[role=slider]]:shadow-[0_0_0_3px_rgba(93,214,255,0.2)] [&>span:first-child]:h-[3px] [&>span:first-child]:bg-[#0a2a52] [&>span:first-child>span]:bg-[#5dd6ff]"
            />
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-10 gap-2 overflow-hidden">
        <div className="col-span-7 min-w-0 grid min-h-0 grid-rows-[0.75fr_0.75fr_1.25fr] gap-2 overflow-hidden">
          <div className="grid min-h-0 min-w-0 grid-cols-1 gap-2 lg:grid-cols-2">
            <PanelCard
              title="劳动力曲线"
              icon={<Users className="h-3.5 w-3.5 text-cyan-300" />}
              titleClassName="text-cyan-200"
            >
                {headcountCurveQuery.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : headcountCurveQuery.isError ? (
                  <div className="flex h-full items-center justify-center text-sm text-destructive">
                    无法获取人员数据
                  </div>
                ) : headcountChartData.length > 0 ? (
                  <div className="h-full w-full">{renderChart(headcountChartData, ["劳动力人数"], "人")}</div>
                ) : (
                  <div className="flex h-full items-center justify-center text-cyan-300/70">
                    暂无人员数据
                  </div>
                )}
            </PanelCard>

            <PanelCard
              title="资金曲线"
              icon={<ChartLine className="h-3.5 w-3.5 text-emerald-400" />}
              titleClassName="text-emerald-300"
            >
                {costCurveQuery.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : costCurveQuery.isError ? (
                  <div className="flex h-full items-center justify-center text-sm text-destructive">
                    无法获取成本数据
                  </div>
                ) : costCurveChartData.length > 0 ? (
                  <div className="h-full w-full">{renderChart(costCurveChartData, ["总成本"], "亿")}</div>
                ) : (
                  <div className="flex h-full items-center justify-center text-cyan-300/70">
                    暂无成本数据
                  </div>
                )}
            </PanelCard>
          </div>

          <div className="grid min-h-0 min-w-0 grid-cols-1 gap-2 lg:grid-cols-2">
            <PanelCard
              title="甘特图"
              icon={<ListTodo className="h-3.5 w-3.5 text-amber-400" />}
              titleClassName="text-amber-300"
            >
                {planTasks.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-cyan-300/70">
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
            </PanelCard>

            <PanelCard
              title="网络图"
              icon={<Network className="h-3.5 w-3.5 text-violet-400" />}
              titleClassName="text-violet-300"
            >
                {planTasks.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-cyan-300/70">
                    当前项目暂无施工任务数据
                  </div>
                ) : (
                  <div className="h-full min-h-0 overflow-hidden">
                    <NetworkDiagram tasks={planTasks} currentDate={selectedTimelineDate} />
                  </div>
                )}
            </PanelCard>
          </div>

          <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-cyan-900/40 bg-[#071a39]/75">
            <CardContent className="flex-1 min-h-0 p-0">
              <div className="flex h-full min-h-0 flex-col gap-2">

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

        <Card className="col-span-3 min-w-0 flex h-full min-h-0 flex-col overflow-hidden border-cyan-900/40 bg-[#071a39]/75">
          <CardHeader className="p-2 pb-1 bg-[#04142d]/80">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                <ListTodo className="h-3.5 w-3.5 text-cyan-300" />
                当日工序
              </CardTitle>
              <div className="inline-flex rounded-md border border-cyan-800/50 bg-[#03112a] p-0.5">
                <button
                  type="button"
                  onClick={() => setDailyProcessTab("plan")}
                  className={`h-5 rounded px-2 text-[11px] transition ${
                    dailyProcessTab === "plan"
                      ? "bg-cyan-500/20 text-cyan-100"
                      : "text-cyan-300/70 hover:text-cyan-200"
                  }`}
                >
                  计划
                </button>
                <button
                  type="button"
                  onClick={() => setDailyProcessTab("actual")}
                  className={`h-5 rounded px-2 text-[11px] transition ${
                    dailyProcessTab === "actual"
                      ? "bg-cyan-500/20 text-cyan-100"
                      : "text-cyan-300/70 hover:text-cyan-200"
                  }`}
                >
                  实际
                </button>
              </div>
            </div>
            <input
              type="text"
              value={dailyProcessKeyword}
              onChange={(e) => setDailyProcessKeyword(e.target.value)}
              placeholder="搜索工序..."
              className="mt-1 h-7 w-full rounded-md border border-cyan-800/50 bg-[#03112a] px-2 text-xs text-cyan-100 placeholder:text-cyan-300/50 outline-none focus:border-cyan-500/70"
            />
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-2">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {filteredDailyProcesses.length === 0 ? (
                  <div className="rounded-md border border-dashed border-cyan-900/50 p-3 text-xs text-cyan-300/70">
                    {dailyProcessKeyword.trim()
                      ? "未匹配到工序"
                      : dailyProcessTab === "plan"
                        ? "暂无当日工序"
                        : "暂无当日实际工序"}
                  </div>
                ) : (
                  filteredDailyProcesses.map((item) => (
                    <div key={item.id} className="rounded-md border border-cyan-900/40 bg-[#03112a] p-2">
                      <div className="text-[11px] text-cyan-300/70">
                        工序 {item.seqNo ?? "-"}
                      </div>
                      <div className="text-xs leading-5 text-cyan-100">{item.name}</div>
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
