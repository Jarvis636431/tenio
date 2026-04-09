import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, ShieldAlert } from "lucide-react";
import { getProcessInfo, type OrderInfoData } from "@/features/project";
import type { PlanTask } from "@/types/domain/plan";
import { RESOURCE_BASE_URL } from "@/config";

interface ProcessMediaRow {
  name: string;
  structureImages: string[];
  extraImages: string[];
  video: string;
}

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: PlanTask | null;
  projectId?: string | null;
  workProcessName?: string;
}

function encodeResourcePath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  projectId,
  workProcessName,
}: TaskDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("drawings");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<OrderInfoData | null>(null);
  const [_isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState<Error | null>(null);
  const [mediaRows, setMediaRows] = useState<ProcessMediaRow[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
    if (!open || !projectId || !workProcessName) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setOrderInfo(null);

    getProcessInfo(projectId, { workProcessName })
      .then((data) => {
        if (cancelled) return;
        setOrderInfo(data.order_info ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, projectId, workProcessName]);

  useEffect(() => {
    if (!open) return;
    setActiveTab("drawings");
    let cancelled = false;
    setMediaLoading(true);
    fetch("/Database/图片 url.json")
      .then((res) => {
        if (!res.ok) throw new Error("无法加载图片库");
        return res.json() as Promise<ProcessMediaRow[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setMediaRows(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setMediaRows([]);
      })
      .finally(() => {
        if (!cancelled) setMediaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const resolveResourceUrl = (path: string) => {
    const trimmed = path.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    if (trimmed.startsWith("/")) {
      return trimmed;
    }
    return `${RESOURCE_BASE_URL}/${encodeResourcePath(trimmed)}`;
  };

  const planeDrawings = useMemo(() => {
    const taskName = task?.task ?? workProcessName ?? "";
    const matched = mediaRows.find((row) => row.name === taskName);
    const images = [...(matched?.structureImages ?? []), ...(matched?.extraImages ?? [])];
    return images.filter(Boolean).map(resolveResourceUrl).filter(Boolean);
  }, [mediaRows, task?.task, workProcessName]);

  const detailImages = useMemo(() => {
    const taskName = task?.task ?? workProcessName ?? "";
    const matched = mediaRows.find((row) => row.name === taskName);
    const images = [...(matched?.structureImages ?? []), ...(matched?.extraImages ?? [])];
    return images.filter(Boolean).map(resolveResourceUrl).filter(Boolean);
  }, [mediaRows, task?.task, workProcessName]);

  const tutorialVideo = useMemo(() => {
    const taskName = task?.task ?? workProcessName ?? "";
    const matched = mediaRows.find((row) => row.name === taskName);
    return matched?.video ? resolveResourceUrl(matched.video) : "";
  }, [mediaRows, task?.task, workProcessName]);
  const workDescription = orderInfo?.["工单内容"];
  const safetyNote = orderInfo?.["安全交底"];
  const technicalNote = orderInfo?.["技术验收标准"];

  if (!task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>暂无任务信息</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">请选择任务后查看详情。</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{task.task ?? workProcessName ?? "未知工序"}</span>
            {task.specialty && <Badge variant="outline">{task.specialty}</Badge>}
            {task.jobType && <Badge variant="secondary">{task.jobType}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-[calc(90vh-120px)] flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="drawings">图纸</TabsTrigger>
            <TabsTrigger value="details">节点大样</TabsTrigger>
            <TabsTrigger value="disclaimer">交底文件</TabsTrigger>
            <TabsTrigger value="tutorial">施工教程</TabsTrigger>
            <TabsTrigger value="acceptance">验收</TabsTrigger>
          </TabsList>

          <TabsContent value="drawings" className="mt-4 flex-1">
            {mediaLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                加载图纸中...
              </div>
            ) : planeDrawings.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-auto pr-2">
                {planeDrawings.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(src)}
                  >
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                      <img
                        src={src}
                        alt={`图纸 ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                暂无平面图纸
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-4 flex-1 overflow-auto">
            {mediaLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                加载节点大样图中...
              </div>
            ) : detailImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-2">
                {detailImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(src)}
                  >
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                      <img
                        src={src}
                        alt={`节点大样图 ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                暂无节点大样图
              </div>
            )}
          </TabsContent>

          <TabsContent value="disclaimer" className="mt-4 flex-1 overflow-auto">
            <div className="prose max-w-none text-sm text-gray-700 space-y-4">
              {workDescription && (
                <div>
                  <p className="font-semibold">工单内容</p>
                  <p>{workDescription}</p>
                </div>
              )}
              {safetyNote && (
                <div>
                  <p className="font-semibold">安全交底</p>
                  <p>{safetyNote}</p>
                </div>
              )}
              {technicalNote && (
                <div>
                  <p className="font-semibold">技术验收标准</p>
                  <p>{technicalNote}</p>
                </div>
              )}
              {!workDescription && !safetyNote && !technicalNote && (
                <p className="text-gray-500 text-sm">暂无交底文件信息</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tutorial" className="mt-4 flex-1">
            {tutorialVideo ? (
              <div className="h-full w-full rounded-lg overflow-hidden bg-black">
                <iframe
                  title="施工教程视频"
                  src={tutorialVideo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
            ) : (
              <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🎥</div>
                  <p>暂无施工教程视频</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="acceptance" className="mt-4 flex-1 overflow-auto">
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">暂无验收数据</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 图片查看大图弹窗 */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>节点大样图</DialogTitle>
              </DialogHeader>
              <div className="bg-black/5 rounded-lg overflow-hidden">
                <img
                  src={selectedImage}
                  alt="节点大样图"
                  className="w-full h-full object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
