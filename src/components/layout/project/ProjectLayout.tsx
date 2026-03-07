import { Outlet, useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { useProjectCoreGraph } from '@/hooks/useProjectCoreGraph';
import { ProjectHeader } from '@/components/layout/project/ProjectHeader';
import { useMemo } from 'react';
import { usePlanExport } from '@/pages/project/plan/hooks/usePlanExport';

export function ProjectLayout() {
  const { id } = useParams();
  const { projects } = useProject();
  const { coreGraph } = useProjectCoreGraph();
  const currentProject = projects.find(p => p.id === id);
  const { handleExportCSV } = usePlanExport(coreGraph);
  
  // 总工期标签逻辑（从 ProjectDetail 移过来）
  const totalDurationLabel = useMemo(() => {
    if (!coreGraph?.work_processes?.length) return "";
    const times = coreGraph.work_processes
      .map((wp) => ({
        start: wp.execution_state?.planned_start_datetime,
        end: wp.execution_state?.planned_end_datetime,
      }))
      .filter((t) => t.start && t.end) as Array<{ start: string; end: string }>;
    if (!times.length) return "";
    const starts = times.map((t) => new Date(t.start).getTime()).filter((v) => !Number.isNaN(v));
    const ends = times.map((t) => new Date(t.end).getTime()).filter((v) => !Number.isNaN(v));
    if (!starts.length || !ends.length) return "";
    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    const totalDays = Math.max(1, Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)) + 1);
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
  
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="px-6 pt-6">
        <ProjectHeader 
          title={currentProject?.name || "项目详情"}
          titleExtra={totalDurationLabel ? `总工期：${totalDurationLabel}` : undefined}
          onsiteCount={onsiteCount}
          onExportReport={handleExportCSV}
        />
      </div>
      
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="h-full overflow-auto">
          <Outlet /> {/* React Router 自动渲染匹配的子路由 */}
        </div>
      </div>
    </div>
  );
}
