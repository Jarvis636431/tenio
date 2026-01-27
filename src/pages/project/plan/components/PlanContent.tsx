import { GanttChart } from "@/components/plan/gantt/GanttChart";
import { TaskOverview } from "@/components/plan/overview/TaskOverview";
import { NetworkDiagram } from "@/components/plan/network/NetworkDiagram";
import type { PlanTask, TimelineScale } from "@/types/domain/plan";

interface PlanContentProps {
  tab?: string;
  paginatedData: PlanTask[];
  currentPage: number;
  itemsPerPage: number;
  filteredDataLength: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditClick: (item: PlanTask) => void;
  onDetailClick: (item: PlanTask) => void;
  onMoreClick: (item: PlanTask) => void;
  ganttData: PlanTask[];
  timelineScale: TimelineScale;
  shutdownEvents: string[];
  onGanttTaskDetail: (taskId: number) => void;
}

export function PlanContent({
  tab,
  paginatedData,
  currentPage,
  itemsPerPage,
  filteredDataLength,
  totalPages,
  onPageChange,
  onEditClick,
  onDetailClick,
  onMoreClick,
  ganttData,
  timelineScale,
  shutdownEvents,
  onGanttTaskDetail,
}: PlanContentProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        {(tab === "overview" || !tab) && (
          <TaskOverview
            paginatedData={paginatedData}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            filteredDataLength={filteredDataLength}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onEditClick={onEditClick}
            onDetailClick={onDetailClick}
            onMoreClick={onMoreClick}
          />
        )}

        {tab === "gantt" && (
          <div className="h-[calc(100vh-200px)]">
            <GanttChart
              data={ganttData}
              scale={timelineScale}
              shutdownEvents={shutdownEvents}
              onTaskDetail={(task) => onGanttTaskDetail(task.id)}
            />
          </div>
        )}

        {tab === "network" && (
          <NetworkDiagram tasks={ganttData} onNodeClick={onMoreClick} />
        )}
      </div>
    </div>
  );
}
