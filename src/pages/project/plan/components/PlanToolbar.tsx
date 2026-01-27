import { TaskFilters } from "@/components/plan/filters/TaskFilters";
import { TaskActions } from "@/components/plan/filters/TaskActions";
import type { TimelineScale } from "@/types/domain/plan";

interface PlanToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  jobFilter: string;
  onJobFilterChange: (value: string) => void;
  floorFilter: string;
  onFloorFilterChange: (value: string) => void;
  jobTypes: string[];
  floorTypes: string[];
  activeView: string;
  timelineScale: TimelineScale;
  onTimelineScaleChange: (value: TimelineScale) => void;
  filteredDataLength: number;
  ganttDataLength: number;
  onExportCSV: () => void;
  onNewTask: () => void;
  currentProjectId?: string;
}

export function PlanToolbar({
  searchTerm,
  onSearchChange,
  jobFilter,
  onJobFilterChange,
  floorFilter,
  onFloorFilterChange,
  jobTypes,
  floorTypes,
  activeView,
  timelineScale,
  onTimelineScaleChange,
  filteredDataLength,
  ganttDataLength,
  onExportCSV,
  onNewTask,
  currentProjectId,
}: PlanToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <TaskFilters
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        jobFilter={jobFilter}
        onJobFilterChange={onJobFilterChange}
        floorFilter={floorFilter}
        onFloorFilterChange={onFloorFilterChange}
        jobTypes={jobTypes}
        floorTypes={floorTypes}
      />
      <TaskActions
        activeView={activeView}
        timelineScale={timelineScale}
        onTimelineScaleChange={onTimelineScaleChange}
        filteredDataLength={filteredDataLength}
        ganttDataLength={ganttDataLength}
        onExportCSV={onExportCSV}
        onNewTask={onNewTask}
        currentProjectId={currentProjectId}
      />
    </div>
  );
}
