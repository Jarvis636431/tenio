import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { useProjectSchedule } from "@/hooks/useProjectSchedule";
import { ModelViewer } from "@/components/ModelViewer";
import { Slider } from "@/components/ui/slider";

interface ProjectHomepageProps {
  projectId: string;
  projectName: string;
}

export function ProjectHomepage({ projectId, projectName }: ProjectHomepageProps) {
  const { scheduleItems, projectInfo, filename, isLoading, error, processGuidMapping, forceRefreshMapping, isMappingFetching } = useProjectSchedule();
  const [activeIndex, setActiveIndex] = useState(0);

  const highlightInfo = useMemo(() => {
    const itemsWithHighlights = scheduleItems.filter((i) => {
      const raw = (processGuidMapping?.[i.task] as unknown);
      const arr = Array.isArray(raw) ? raw : [];
      const hasValid = arr.some((id) => {
        if (typeof id === "number") {
          return Number.isFinite(id);
        }
        if (typeof id === "string") {
          const trimmed = id.trim();
          if (!trimmed) return false;
          if (/^\d+$/.test(trimmed)) {
            return !Number.isNaN(parseInt(trimmed, 10));
          }
          return true;
        }
        return false;
      });
      return hasValid;
    });

    const highlightSet = new Set<number | string>();
    itemsWithHighlights.forEach((i) => {
      const raw = (processGuidMapping?.[i.task] as unknown);
      const arr = Array.isArray(raw) ? raw : [];
      arr.forEach((id) => {
        if (typeof id === "number" && Number.isFinite(id)) {
          highlightSet.add(id);
          return;
        }
        if (typeof id === "string") {
          const trimmed = id.trim();
          if (!trimmed) return;
          if (/^\d+$/.test(trimmed)) {
            const n = parseInt(trimmed, 10);
            if (!Number.isNaN(n)) highlightSet.add(n);
          } else {
            highlightSet.add(trimmed);
          }
        }
      });
    });

    return {
      highlightCount: highlightSet.size,
      highlightIds: Array.from(highlightSet),
    };
  }, [scheduleItems, processGuidMapping]);

  const sanitizeIds = (ids: Array<number | string> | undefined): Array<number | string> => {
    const arr = Array.isArray(ids) ? ids : [];
    const out: Array<number | string> = [];
    arr.forEach((id) => {
      if (typeof id === "number" && Number.isFinite(id)) {
        out.push(id);
      } else if (typeof id === "string") {
        const t = id.trim();
        if (!t) return;
        if (/^\d+$/.test(t)) {
          const n = parseInt(t, 10);
          if (!Number.isNaN(n)) out.push(n);
        } else {
          out.push(t);
        }
      }
    });
    return out;
  };

  const orderedTasks = useMemo(() => scheduleItems.map((i) => i.task), [scheduleItems]);
  const completedIds = useMemo(() => {
    return orderedTasks.slice(0, Math.max(0, activeIndex)).flatMap((name) => sanitizeIds(processGuidMapping?.[name]));
  }, [orderedTasks, activeIndex, processGuidMapping]);
  const inProgressIds = useMemo(() => sanitizeIds(processGuidMapping?.[orderedTasks[activeIndex]]), [orderedTasks, activeIndex, processGuidMapping]);

  useEffect(() => {
    const withIds = scheduleItems
      .map((i) => ({ task: i.task, ids: Array.isArray(processGuidMapping?.[i.task]) ? (processGuidMapping?.[i.task] as Array<number | string>) : [] }))
      .filter(({ ids }) => {
        const arr = Array.isArray(ids) ? ids : [];
        return arr.some((id) => {
          if (typeof id === "number") return Number.isFinite(id);
          if (typeof id === "string") return id.trim().length > 0;
          return false;
        });
      });
    if (withIds.length > 0) {
      console.log("[ProjectHomepage] 工序含有映射ID:", withIds);
    }
  }, [scheduleItems, processGuidMapping]);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">项目ID: {projectId}</p>
          {filename && <p className="text-gray-600">源文件: {filename}</p>}
          {isLoading && <p className="text-gray-500">数据加载中...</p>}
          {error && <p className="text-destructive">加载失败：{error.message}</p>}
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => forceRefreshMapping()} disabled={isMappingFetching}>
            <RefreshCcw />
            强制刷新映射
          </Button>
        </div>
      </div>

      

      <Card>
        <CardHeader>
          <CardTitle>模型预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">工序位置：{activeIndex + 1} / {orderedTasks.length}</div>
              <div className="text-sm">
                <span className="mr-3">进行中：{inProgressIds.length} 构件</span>
                <span>已完成：{completedIds.length} 构件</span>
                <span className="ml-3 text-muted-foreground">高亮构件：{highlightInfo.highlightCount}</span>
              </div>
            </div>
            <Slider
              value={[Math.min(activeIndex, Math.max(0, orderedTasks.length - 1))]}
              min={0}
              max={Math.max(0, orderedTasks.length - 1)}
              step={1}
              onValueChange={(v) => setActiveIndex(Array.isArray(v) ? (v[0] ?? 0) : 0)}
            />

            <div className="relative w-full h-[500px]">
              <div className="absolute inset-0">
                <ModelViewer
                  src="/models/0923.ifc"
                  highlightIds={completedIds}
                  highlightColor="#22c55e"
                  className="h-full"
                />
              </div>
              <div className="absolute inset-0">
                <ModelViewer
                  src="/models/0923.ifc"
                  highlightIds={inProgressIds}
                  highlightColor="#f59e0b"
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
