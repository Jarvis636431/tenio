import { useMemo, useState } from "react";
import { HardHat, MapPin, Clock } from "lucide-react";
import type { CrewPlanArtifact, CrewPlanTask } from "../types";

interface RotationTabProps {
  crewPlanArtifact?: CrewPlanArtifact;
  isLoading?: boolean;
}

const TRADE_COLORS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#f97316", // orange
  "#ec4899", // pink
];

type Crew = {
  id: string;
  name: string;
  trade: string;
  color: string;
  taskCount: number;
  totalWorkDays: number;
  status: string;
  tasks: RotationTask[];
};

type TradeGroup = {
  trade: string;
  color: string;
  crews: Crew[];
};

type RotationTask = {
  id: string;
  name: string;
  trade: string;
  location: string;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  startDate: string;
  endDate: string;
};

function formatCrewStatus(status: string) {
  const statusMap: Record<string, { label: string; hint: string; className: string }> = {
    planned: { label: "待进场", hint: "按计划进场", className: "text-amber-400" },
    active: { label: "进行中", hint: "现场作业中", className: "text-emerald-400" },
    in_progress: { label: "进行中", hint: "现场作业中", className: "text-emerald-400" },
    completed: { label: "已完成", hint: "任务已完成", className: "text-cyan-300" },
  };

  return (
    statusMap[status] ?? { label: status || "未知", hint: "接口状态", className: "text-slate-200" }
  );
}

function mapTask(task: CrewPlanTask, trade: string): RotationTask {
  return {
    id: task.crew_task_id,
    name: task.task_name,
    trade,
    location: task.work_location,
    startLabel: task.start_label,
    endLabel: task.end_label,
    durationLabel: task.duration_label,
    startDate: task.start_date,
    endDate: task.end_date,
  };
}

function buildTradeGroups(artifact?: CrewPlanArtifact): TradeGroup[] {
  const crewTypes = artifact?.crew_types ?? [];

  return crewTypes.map((group) => {
    const color = group.color_hex || TRADE_COLORS[0];
    const crews: Crew[] = group.crews.map((crew) => ({
      id: crew.crew_id,
      name: crew.crew_name,
      trade: group.crew_type_name,
      color,
      taskCount: crew.task_count,
      totalWorkDays: crew.total_work_days,
      status: crew.crew_status,
      tasks: crew.tasks.map((task) => mapTask(task, group.crew_type_name)),
    }));

    return { trade: group.crew_type_name, color, crews };
  });
}

export function RotationTab({ crewPlanArtifact, isLoading = false }: RotationTabProps) {
  const [filter, setFilter] = useState("");
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);

  const tradeGroups = useMemo<TradeGroup[]>(
    () => buildTradeGroups(crewPlanArtifact),
    [crewPlanArtifact],
  );

  const filteredGroups = useMemo(() => {
    if (!filter.trim()) return tradeGroups;
    const kw = filter.trim().toLowerCase();
    return tradeGroups
      .map((g) => ({
        ...g,
        crews: g.crews.filter(
          (c) => c.name.toLowerCase().includes(kw) || c.trade.toLowerCase().includes(kw),
        ),
      }))
      .filter((g) => g.crews.length > 0 || g.trade.toLowerCase().includes(kw));
  }, [tradeGroups, filter]);

  const activeCrew = useMemo(() => {
    const crews = filteredGroups.flatMap((group) => group.crews);
    return crews.find((crew) => crew.id === selectedCrewId) ?? crews[0] ?? null;
  }, [filteredGroups, selectedCrewId]);

  const activeCrewStatus = activeCrew ? formatCrewStatus(activeCrew.status) : null;

  if (isLoading) {
    return (
      <div className="flex h-[360px] items-center justify-center text-sm text-apm-muted">
        人员轮转加载中...
      </div>
    );
  }

  if (tradeGroups.length === 0) {
    return (
      <div className="flex h-[360px] items-center justify-center text-sm text-apm-muted">
        当前项目暂无人员轮转数据
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[520px] flex-col gap-4 lg:flex-row">
      {/* Left sidebar */}
      <div className="w-full shrink-0 border border-white/[0.08] bg-apm-card p-3 lg:w-[260px]">
        <div className="relative mb-3">
          <input
            type="text"
            aria-label="搜索班组"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索班组..."
            className="h-8 w-full rounded-sm border border-white/[0.08] bg-transparent px-3 text-xs text-slate-100 placeholder:text-apm-dim outline-none focus:border-cyan-400/40"
          />
        </div>
        <div className="max-h-[420px] overflow-y-auto space-y-3 lg:max-h-none">
          {filteredGroups.map((g) => (
            <div key={g.trade}>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: g.color }}
                />
                {g.trade}
                <span className="ml-auto rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-apm-muted">
                  {g.crews.length}
                </span>
              </div>
              <div className="space-y-1 pl-1">
                {g.crews.map((c) => {
                  const isActive = activeCrew?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCrewId(c.id)}
                      className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs transition ${
                        isActive
                          ? "bg-cyan-400/10 text-cyan-200"
                          : "text-apm-muted hover:bg-slate-800/60 hover:text-slate-200"
                      }`}
                    >
                      <span className="truncate pr-2">{c.name}</span>
                      <span className="shrink-0 text-[10px] text-apm-dim">{c.taskCount} 项</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right main */}
      <div className="flex-1 border border-white/[0.08] bg-apm-card p-4">
        {!activeCrew ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-apm-muted">
            请选择左侧班组查看详情
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-lg"
                style={{
                  background: `${activeCrew.color}22`,
                  border: `1px solid ${activeCrew.color}55`,
                  color: activeCrew.color,
                }}
              >
                <HardHat className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{activeCrew.name}</div>
                <div className="text-[11px] text-apm-muted">{activeCrew.trade} · 项目班组详情</div>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-white/[0.08] bg-[rgba(4,18,37,0.7)] p-3">
                <div className="text-[10px] text-apm-muted">任务数</div>
                <div className="mt-1 text-xl font-bold text-white">{activeCrew.taskCount}</div>
                <div className="text-[10px] text-apm-dim">项施工任务</div>
              </div>
              <div className="border border-white/[0.08] bg-[rgba(4,18,37,0.7)] p-3">
                <div className="text-[10px] text-apm-muted">总工时</div>
                <div className="mt-1 text-xl font-bold text-white">{activeCrew.totalWorkDays}</div>
                <div className="text-[10px] text-apm-dim">天</div>
              </div>
              <div className="border border-white/[0.08] bg-[rgba(4,18,37,0.7)] p-3">
                <div className="text-[10px] text-apm-muted">工种</div>
                <div className="mt-1 text-sm font-bold text-white">{activeCrew.trade}</div>
                <div className="text-[10px] text-apm-dim">专业班组</div>
              </div>
              <div className="border border-white/[0.08] bg-[rgba(4,18,37,0.7)] p-3">
                <div className="text-[10px] text-apm-muted">状态</div>
                <div className={`mt-1 text-sm font-bold ${activeCrewStatus?.className}`}>
                  {activeCrewStatus?.label}
                </div>
                <div className="text-[10px] text-apm-dim">{activeCrewStatus?.hint}</div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Clock className="h-3.5 w-3.5" style={{ color: activeCrew.color }} />
                任务明细 · {activeCrew.taskCount} 项
              </div>
              <div className="space-y-2">
                {activeCrew.tasks.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center gap-2 rounded-sm border border-white/[0.08] bg-[rgba(2,14,30,0.5)] px-3 py-2"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] text-slate-300">
                      {i + 1}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: activeCrew.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{t.name}</span>
                    <span className="flex items-center gap-1 text-[10px] text-apm-muted">
                      <MapPin
                        className="h-3 w-3"
                        style={{ color: activeCrew.color, opacity: 0.6 }}
                      />
                      {t.location || t.trade}
                    </span>
                    <span className="text-[10px] text-apm-dim">
                      {t.startLabel} - {t.endLabel}
                    </span>
                    <span className="text-[10px] text-apm-dim">
                      {t.startDate} - {t.endDate}
                    </span>
                    <span className="text-[10px] text-apm-dim">{t.durationLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
