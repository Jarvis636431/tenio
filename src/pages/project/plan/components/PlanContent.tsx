import { GanttChart } from "@/components/plan/gantt/GanttChart";
import { NetworkDiagram } from "@/components/plan/network/NetworkDiagram";
import type { PlanTask, TimelineScale } from "@/types/domain/plan";

interface PlanContentProps {
  tab?: string;
  onMoreClick: (item: PlanTask) => void;
  ganttData: PlanTask[];
  timelineScale: TimelineScale;
  shutdownEvents: string[];
  onGanttTaskDetail: (taskId: string) => void;
}

export function PlanContent({
  tab,
  onMoreClick,
  ganttData,
  timelineScale,
  shutdownEvents,
  onGanttTaskDetail,
}: PlanContentProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        {tab !== "network" && (
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
