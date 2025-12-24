import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { TimelineScale } from "@/components/plan/GanttChart";

interface TaskActionsProps {
  activeView: string;
  timelineScale: TimelineScale;
  onTimelineScaleChange: (scale: TimelineScale) => void;
  filteredDataLength: number;
  ganttDataLength: number;
  onExportCSV: () => void;
  onNewTask: () => void;
  currentProjectId?: string;
}

const TIMELINE_SCALE_LABELS: Record<TimelineScale, string> = {
  day: "天",
  hour: "小时",
  week: "周",
  month: "月",
};

export function TaskActions({
  activeView,
  timelineScale,
  onTimelineScaleChange,
  filteredDataLength,
  ganttDataLength,
  onExportCSV,
  onNewTask,
  currentProjectId
}: TaskActionsProps) {
  return (
    <div className="flex items-center space-x-4">
      {activeView === 'gantt-chart' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
              <span>时间粒度：{TIMELINE_SCALE_LABELS[timelineScale]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {(Object.entries(TIMELINE_SCALE_LABELS) as [TimelineScale, string][]).map(([value, label]) => (
              <DropdownMenuItem
                key={value}
                onSelect={() => onTimelineScaleChange(value)}
                className={timelineScale === value ? "bg-muted font-medium" : ""}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <div className="text-sm text-muted-foreground">
        {activeView === 'gantt-chart' ? `显示 ${ganttDataLength} 个任务` : `显示 ${filteredDataLength} 个任务`}
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          导出
        </Button>
        <Button
          size="sm"
          onClick={onNewTask}
          disabled={!currentProjectId}
        >
          <Plus className="h-4 w-4 mr-2" />
          新增任务
        </Button>
      </div>
    </div>
  );
}