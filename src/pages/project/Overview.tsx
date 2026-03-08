import { Card, CardContent } from "@/components/ui/card";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChartLine,
  Download,
  ListTodo,
  Network,
  Boxes,
  SlidersHorizontal,
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
import { ProjectTrendChart } from "@/pages/project/components/ProjectTrendChart";
import { ModelViewer } from "@/components/model/ModelViewer";
import { GanttChart } from "@/components/plan/gantt/GanttChart";
import { NetworkDiagram } from "@/components/plan/network/NetworkDiagram";
import { getProjectCostCurve, getProjectHeadcountCurve } from "@/services/schedulepro-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OverviewProps {
  projectId?: string;
  projectName?: string;
}

type PanelVisibility = {
  headcount: boolean;
  cost: boolean;
  gantt: boolean;
  network: boolean;
  model: boolean;
};

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>({
    headcount: true,
    cost: true,
    gantt: true,
    network: true,
    model: true,
  });
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
  const showTrendPanels = panelVisibility.headcount || panelVisibility.cost;
  const showPlanPanels = panelVisibility.gantt || panelVisibility.network;
  const showModelPanel = panelVisibility.model;
  const trendVisibleCount = Number(panelVisibility.headcount) + Number(panelVisibility.cost);
  const planVisibleCount = Number(panelVisibility.gantt) + Number(panelVisibility.network);
  const visiblePanelCount = useMemo(
    () => Object.values(panelVisibility).filter(Boolean).length,
    [panelVisibility],
  );
  const leftRowTemplate = useMemo(() => {
    const rows: string[] = [];
    if (showTrendPanels) rows.push("0.75fr");
    if (showPlanPanels) rows.push("0.75fr");
    if (showModelPanel) rows.push("1.25fr");
    return rows.length ? rows.join(" ") : "1fr";
  }, [showModelPanel, showPlanPanels, showTrendPanels]);


  // 初始化当前天数为项目开始天数
  useEffect(() => {
    if (timeRange && currentDay === 1) {
      setCurrentDay(timeRange.startDay);
    }
  }, [timeRange]);

  useEffect(() => {
    if (!isPlaying || !timeRange) return;

    const intervalByRate: Record<1 | 2 | 4, number> = {
      1: 1000,
      2: 500,
      4: 250,
    };

    const timer = window.setInterval(() => {
      setCurrentDay((prev) => {
        if (prev >= timeRange.endDay) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalByRate[playbackRate]);

    return () => window.clearInterval(timer);
  }, [isPlaying, playbackRate, timeRange]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 bg-gradient-to-b from-[#020a1d] to-[#041332] px-1 pt-0 pb-1 text-slate-100">
      <div className="shrink-0">
        <ProjectHeader
          title={currentProjectName}
          titleExtra={totalDurationLabel ? `总工期：${totalDurationLabel}` : undefined}
          onsiteCount={onsiteCount}
          actions={(
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 border border-[#2f5e94] bg-[#0a2f5f] px-2 text-[#cfe6ff] hover:bg-[#12417c]"
                  >
                    <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                    视图 {visiblePanelCount}/5
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 border-cyan-900/60 bg-[#03112a] text-cyan-100"
                >
                  <DropdownMenuLabel className="text-cyan-200">显示面板</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-cyan-900/60" />
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      setPanelVisibility((prev) => ({ ...prev, headcount: !prev.headcount }));
                    }}
                  >
                    <Users className="mr-2 h-4 w-4 text-cyan-300" />
                    <span className="flex-1">劳动力曲线</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
                      {panelVisibility.headcount && <Check className="h-3 w-3 text-cyan-200" />}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      setPanelVisibility((prev) => ({ ...prev, cost: !prev.cost }));
                    }}
                  >
                    <ChartLine className="mr-2 h-4 w-4 text-emerald-300" />
                    <span className="flex-1">资金曲线</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
                      {panelVisibility.cost && <Check className="h-3 w-3 text-cyan-200" />}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      setPanelVisibility((prev) => ({ ...prev, gantt: !prev.gantt }));
                    }}
                  >
                    <ListTodo className="mr-2 h-4 w-4 text-amber-300" />
                    <span className="flex-1">甘特图</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
                      {panelVisibility.gantt && <Check className="h-3 w-3 text-cyan-200" />}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      setPanelVisibility((prev) => ({ ...prev, network: !prev.network }));
                    }}
                  >
                    <Network className="mr-2 h-4 w-4 text-violet-300" />
                    <span className="flex-1">网络图</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
                      {panelVisibility.network && <Check className="h-3 w-3 text-cyan-200" />}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      setPanelVisibility((prev) => ({ ...prev, model: !prev.model }));
                    }}
                  >
                    <Boxes className="mr-2 h-4 w-4 text-cyan-300" />
                    <span className="flex-1">模型区</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
                      {panelVisibility.model && <Check className="h-3 w-3 text-cyan-200" />}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 border border-[#2f5e94] bg-[#0a2f5f] px-3 text-[#cfe6ff] hover:bg-[#12417c]"
                disabled={!handleExportCSV}
              >
                <Download className="mr-1.5 h-4 w-4" />
                报告导出
              </Button>
            </div>
          )}
        />
      </div>

      {timeRange && (
        <ProjectSlider
          currentDay={currentDay}
          startDay={timeRange.startDay}
          endDay={timeRange.endDay}
          playbackRate={playbackRate}
          isPlaying={isPlaying}
          dateLabel={selectedTimelineDateLabel}
          progress={timelineProgress}
          onPreviousDay={() => {
            setIsPlaying(false);
            setCurrentDay((d) => Math.max(timeRange.startDay, d - 1));
          }}
          onTogglePlay={() => {
            if (currentDay >= timeRange.endDay) {
              setCurrentDay(timeRange.startDay);
              setIsPlaying(true);
              return;
            }
            setIsPlaying((prev) => !prev);
          }}
          onNextDay={() => {
            setIsPlaying(false);
            setCurrentDay((d) => Math.min(timeRange.endDay, d + 1));
          }}
          onChangeRate={setPlaybackRate}
          onChangeDay={(day) => {
            setIsPlaying(false);
            setCurrentDay(day);
          }}
        />
      )}

      <div className="grid min-h-0 flex-1 grid-cols-10 gap-2 overflow-hidden">
        <div
          className="col-span-7 min-w-0 grid min-h-0 gap-2 overflow-hidden"
          style={{ gridTemplateRows: leftRowTemplate }}
        >
          {showTrendPanels && (
            <div
              className={`grid min-h-0 min-w-0 grid-cols-1 gap-2 ${
                trendVisibleCount > 1 ? "lg:grid-cols-2" : "lg:grid-cols-1"
              }`}
            >
              {panelVisibility.headcount && (
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
                    <div className="h-full w-full">
                      <ProjectTrendChart
                        data={headcountChartData}
                        seriesNames={["劳动力人数"]}
                        unit="人"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-cyan-300/70">
                      暂无人员数据
                    </div>
                  )}
                </PanelCard>
              )}

              {panelVisibility.cost && (
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
                    <div className="h-full w-full">
                      <ProjectTrendChart
                        data={costCurveChartData}
                        seriesNames={["总成本"]}
                        unit="亿"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-cyan-300/70">
                      暂无成本数据
                    </div>
                  )}
                </PanelCard>
              )}
            </div>
          )}

          {showPlanPanels && (
            <div
              className={`grid min-h-0 min-w-0 grid-cols-1 gap-2 ${
                planVisibleCount > 1 ? "lg:grid-cols-2" : "lg:grid-cols-1"
              }`}
            >
              {panelVisibility.gantt && (
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
              )}

              {panelVisibility.network && (
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
              )}
            </div>
          )}

          {showModelPanel && (
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
          )}
        </div>

        <DailyCard items={dailyProcesses} />
      </div>
    </div>
  );
}
