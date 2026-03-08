import { Card, CardContent } from "@/components/ui/card";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChartLine,
  ListTodo,
  Network,
  Users,
} from "lucide-react";
import { useProjectCoreGraph } from "@/hooks/useProjectCoreGraph";
import { useProjectHighlight } from "@/hooks/useProjectHighlight";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/hooks/useAuth";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import { useProjectExport } from "@/pages/project/hooks/useProjectExport";
import { usePlanTasks } from "@/pages/project/hooks/usePlanTasks";
import { useDailyProcesses } from "@/pages/project/hooks/useDailyProcesses";
import { useTimelineHighlight } from "@/pages/project/hooks/useTimelineHighlight";
import { ProjectHeader } from "@/pages/project/components/ProjectHeader";
import { PanelCard } from "@/pages/project/components/PanelCard";
import { ProjectSlider } from "@/pages/project/components/ProjectSlider";
import { DailyCard } from "@/pages/project/components/DailyCard";
import { ModelViewer } from "@/components/model/ModelViewer";
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
  const { coreGraph } = useProjectCoreGraph();
  const { config } = useProjectConfig();
  const { currentProject, projects } = useProject();
  const { token } = useAuth();
  const { handleExportCSV } = useProjectExport(coreGraph);
  const { tagMap, processHighlights, getIdsByDate } =
    useProjectHighlight(projectId);
  const [currentDay, setCurrentDay] = useState(1);
  const [playbackRate, setPlaybackRate] = useState<1 | 2 | 4>(1);
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

  const planTasks = usePlanTasks(coreGraph);

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

  const { completedIds, inProgressIds } = useTimelineHighlight(
    selectedTimelineDate,
    getIdsByDate,
  );
  const dailyProcesses = useDailyProcesses(
    processHighlights,
    planTasks,
    selectedTimelineDate,
  );


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
        <ProjectSlider
          currentDay={currentDay}
          startDay={timeRange.startDay}
          endDay={timeRange.endDay}
          playbackRate={playbackRate}
          dateLabel={selectedTimelineDateLabel}
          progress={timelineProgress}
          onPreviousDay={() => setCurrentDay((d) => Math.max(timeRange.startDay, d - 1))}
          onPlayNextDay={() => setCurrentDay((d) => Math.min(timeRange.endDay, d + 1))}
          onNextDay={() => setCurrentDay((d) => Math.min(timeRange.endDay, d + 1))}
          onChangeRate={setPlaybackRate}
          onChangeDay={setCurrentDay}
        />
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

        <DailyCard items={dailyProcesses} />
      </div>
    </div>
  );
}
