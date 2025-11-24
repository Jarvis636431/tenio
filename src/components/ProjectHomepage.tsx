import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";
import { useMemo, useEffect } from "react";
import { useProjectSchedule } from "@/hooks/useProjectSchedule";
import { ModelViewer } from "@/components/ModelViewer";

interface ProjectHomepageProps {
  projectId: string;
  projectName: string;
}

export function ProjectHomepage({ projectId, projectName }: ProjectHomepageProps) {
  const { scheduleItems, projectInfo, filename, isLoading, error, processGuidMapping } = useProjectSchedule();

  const stats = useMemo(() => {
    const totalTasks = scheduleItems.length;
    const completedTasks = scheduleItems.filter((i) =>
      String(i.constructionSituation || "").includes("完成")
    ).length;
    const inProgressTasks = scheduleItems.filter((i) => {
      const s = String(i.constructionSituation || "");
      return s.includes("进行") || s.includes("施工") || s.includes("开展");
    }).length;
    const pendingTasks = Math.max(0, totalTasks - completedTasks - inProgressTasks);

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalDurationLabel = (() => {
      const row = projectInfo.find((r) => {
        const label = r["项目信息"] ?? r["项目统计"];
        return typeof label === "string" && label.includes("总工期");
      });
      if (!row) return "";
      const key = Object.keys(row).find((k) => {
        if (k === "项目信息" || k === "项目统计" || k.toLowerCase().includes("index")) return false;
        const v = row[k];
        return v !== undefined && v !== null && String(v).trim() !== "";
      });
      if (!key) return "";
      const v = row[key];
      return typeof v === "string" ? v.trim() : String(v ?? "").trim();
    })();

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
          return true; // 非空字符串，作为 GlobalId 使用
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
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      progressPercentage,
      totalDurationLabel,
      highlightCount: highlightSet.size,
      highlightIds: Array.from(highlightSet),
    };
  }, [scheduleItems, projectInfo]);

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
      <div>
        <p className="text-gray-600">项目ID: {projectId}</p>
        {filename && <p className="text-gray-600">源文件: {filename}</p>}
        {isLoading && <p className="text-gray-500">数据加载中...</p>}
        {error && <p className="text-destructive">加载失败：{error.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">任务进度</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.progressPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} / {stats.totalTasks} 任务完成（进行中 {stats.inProgressTasks}，未开始 {stats.pendingTasks}）
            </p>
            <Progress value={stats.progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总工期</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.totalDurationLabel || "--"}</div>
            <p className="text-xs text-muted-foreground">来自 /view 项目统计</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高亮构件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.highlightCount}</div>
            <p className="text-xs text-muted-foreground">聚合自各工序的 highlight_ids</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>模型预览</CardTitle>
        </CardHeader>
        <CardContent>
          <ModelViewer
            src="/models/0923.ifc"
            highlightIds={stats.highlightIds as Array<number | string>}
            className="h-[500px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
