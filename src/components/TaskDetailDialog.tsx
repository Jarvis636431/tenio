import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, ShieldAlert } from "lucide-react";
import { getProcessInfo, OrderInfoData, ProcessInfoData } from "@/services/project-service";
import { useAuth } from "@/contexts/AuthContext";
import { ModelViewer } from "@/components/ModelViewer";

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any; // TaskItem type
  projectId?: string | null;
  workProcessName?: string;
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  projectId,
  workProcessName,
}: TaskDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("3d");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<OrderInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!open || !projectId || !workProcessName) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setOrderInfo(null);

    getProcessInfo(projectId, token || undefined, { workProcessName })
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
  }, [open, projectId, workProcessName, token]);

  const planeDrawings = useMemo(() => {
    const raw = orderInfo?.["详细信息"];
    if (!raw) return [];
    return Array.isArray(raw) ? raw.filter(Boolean) : [raw];
  }, [orderInfo]);

  const detailImages = useMemo(() => {
    const raw = orderInfo?.["节点大样图"];
    if (!raw) return [];
    return Array.isArray(raw) ? raw.filter(Boolean) : [raw];
  }, [orderInfo]);

  const tutorialVideo = orderInfo?.["视频"] ?? "";
  const workDescription = orderInfo?.["工单内容"];
  const safetyNote = orderInfo?.["安全交底"];
  const technicalNote = orderInfo?.["技术验收标准"];
  const highlightedComponentIds = orderInfo?.["构件"] || [];

  console.log("highlightedComponentIds:", highlightedComponentIds);

  if (!task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>暂无任务信息</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            请选择任务后查看详情。
          </div>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-[calc(90vh-120px)] flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="3d">三维模型</TabsTrigger>
            <TabsTrigger value="drawings">图纸</TabsTrigger>
            <TabsTrigger value="details">节点大样</TabsTrigger>
            <TabsTrigger value="disclaimer">交底文件</TabsTrigger>
            <TabsTrigger value="tutorial">施工教程</TabsTrigger>
          </TabsList>

          <TabsContent value="3d" className="mt-4 flex-1">
            <ModelViewer
              src="/models/0923.ifc"
              highlightIds={highlightedComponentIds}
              className="h-full"
            />
          </TabsContent>

          <TabsContent value="drawings" className="mt-4 flex-1">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                加载图纸中...
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-destructive gap-2">
                <ShieldAlert className="h-6 w-6" />
                <p className="text-sm">获取图纸失败：{error.message}</p>
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
                      <img src={src} alt={`图纸 ${index + 1}`} className="h-full w-full object-cover" />
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
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                加载节点大样图中...
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-destructive gap-2">
                <ShieldAlert className="h-6 w-6" />
                <p className="text-sm">获取节点大样失败：{error.message}</p>
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
                      <img src={src} alt={`节点大样图 ${index + 1}`} className="h-full w-full object-cover" />
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
        </Tabs>

        {/* 图片查看大图弹窗 */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>节点大样图</DialogTitle>
              </DialogHeader>
              <div className="bg-black/5 rounded-lg overflow-hidden">
                <img src={selectedImage} alt="节点大样图" className="w-full h-full object-contain" />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
