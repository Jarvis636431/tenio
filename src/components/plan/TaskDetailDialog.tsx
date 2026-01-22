import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Loader2,
  ShieldAlert,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getProcessInfo } from "@/services/project-service";
import type { OrderInfoData, ProcessInfoData } from "@/types/domain/project";
import { useAuth } from "@/hooks/useAuth";
import { ModelViewer } from "@/components/model/ModelViewer";
import type { PlanTask } from "@/types/domain/plan";

// 验收数据接口
interface AcceptanceData {
  工序序号: string;
  验收阶段: string;
  步骤1: string;
  步骤2: string;
  步骤3: string;
  步骤4: string;
  步骤1状态: string;
  步骤2状态: string;
  步骤3状态: string;
  步骤4状态: string;
  拍摄要求1: string;
  拍摄要求2: string;
  拍摄要求3: string;
  现场照片1: string;
  现场照片2: string;
  现场照片3: string;
  人像照片: string;
  验收状态: string;
  验收备注: string;
}

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: PlanTask | null;
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
  const [acceptanceData, setAcceptanceData] = useState<AcceptanceData | null>(
    null,
  );
  const [acceptanceLoading, setAcceptanceLoading] = useState(false);
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

  // 加载验收数据
  const loadAcceptanceData = async (processNumber: string) => {
    try {
      setAcceptanceLoading(true);
      const response = await fetch("/Database/验收数据.csv");
      if (!response.ok) {
        throw new Error("无法加载验收数据");
      }

      const csvText = await response.text();
      const lines = csvText.trim().split("\n");
      if (lines.length <= 1) return null;

      const headers = lines[0].split(",");

      // 查找匹配的工序
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",");
        const data: Record<string, string> = {};

        headers.forEach((header, index) => {
          data[header] = row[index] || "";
        });

        // 通过工序序号匹配
        if (data["工序序号"] === processNumber) {
          return data as unknown as AcceptanceData;
        }
      }

      return null;
    } catch (error) {
      console.error("加载验收数据失败:", error);
      return null;
    } finally {
      setAcceptanceLoading(false);
    }
  };

  // 当任务变化时加载验收数据
  useEffect(() => {
    if (task && task.id) {
      // 假设task.id就是工序序号，或者从task中提取序号
      const processNumber = task.id?.toString() || "1";
      loadAcceptanceData(processNumber).then(setAcceptanceData);
    }
  }, [task]);

  // 获取步骤状态图标
  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  // 获取步骤状态样式
  const getStepStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500 border-green-500";
      case "in_progress":
        return "bg-blue-500 border-blue-500";
      case "pending":
        return "bg-white border-gray-300";
      default:
        return "bg-white border-gray-300";
    }
  };

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
            {task.specialty && (
              <Badge variant="outline">{task.specialty}</Badge>
            )}
            {task.jobType && <Badge variant="secondary">{task.jobType}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-[calc(90vh-120px)] flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="3d">三维模型</TabsTrigger>
            <TabsTrigger value="drawings">图纸</TabsTrigger>
            <TabsTrigger value="details">节点大样</TabsTrigger>
            <TabsTrigger value="disclaimer">交底文件</TabsTrigger>
            <TabsTrigger value="tutorial">施工教程</TabsTrigger>
            <TabsTrigger value="acceptance">验收</TabsTrigger>
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
            {acceptanceLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                加载验收数据中...
              </div>
            ) : acceptanceData ? (
              <div className="space-y-6 pr-2">
                {/* 验收状态 */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">验收状态:</span>
                  <Badge
                    variant={
                      acceptanceData.验收状态 === "completed"
                        ? "default"
                        : acceptanceData.验收状态 === "in_progress"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {acceptanceData.验收状态 === "completed"
                      ? "已完成"
                      : acceptanceData.验收状态 === "in_progress"
                        ? "进行中"
                        : "待验收"}
                  </Badge>
                  {acceptanceData.验收备注 && (
                    <span className="text-sm text-gray-600">
                      - {acceptanceData.验收备注}
                    </span>
                  )}
                </div>

                {/* 流程步骤 */}
                <div className="relative">
                  {/* 连接线 */}
                  <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-300" />

                  <div className="grid grid-cols-4 gap-4 relative">
                    {/* 动态生成步骤 */}
                    {[1, 2, 3, 4].map((stepNum) => {
                      const stepText = acceptanceData[
                        `步骤${stepNum}` as keyof AcceptanceData
                      ] as string;
                      const stepStatus = acceptanceData[
                        `步骤${stepNum}状态` as keyof AcceptanceData
                      ] as string;

                      return (
                        <div
                          key={stepNum}
                          className="flex flex-col items-center"
                        >
                          <div
                            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center mb-4 relative z-10 ${getStepStatusStyle(stepStatus)}`}
                          >
                            {stepStatus === "completed" ? (
                              <CheckCircle className="h-6 w-6 text-white" />
                            ) : stepStatus === "in_progress" ? (
                              <Clock className="h-6 w-6 text-white" />
                            ) : (
                              <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            )}
                          </div>
                          <div className="bg-gray-200 px-3 py-2 rounded text-center text-sm min-h-[30px] flex items-center">
                            <span>{stepText}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 拍摄要求和现场照片区域 */}
                <div className="grid grid-cols-4 gap-4">
                  {/* 左侧 3 列 - 拍摄要求和现场照片 */}
                  <div className="col-span-3 space-y-4">
                    {/* 拍摄位置要求 */}
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((reqNum) => {
                        const requirement = acceptanceData[
                          `拍摄要求${reqNum}` as keyof AcceptanceData
                        ] as string;
                        return (
                          <div
                            key={reqNum}
                            className="bg-blue-500 text-white px-4 py-3 rounded-lg flex items-center justify-center min-h-[60px]"
                          >
                            <p className="text-center font-medium text-sm">
                              {requirement}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* 现场照片 */}
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((photoNum) => {
                        const photoPath = acceptanceData[
                          `现场照片${photoNum}` as keyof AcceptanceData
                        ] as string;
                        return (
                          <div
                            key={photoNum}
                            className="bg-gray-200 rounded-lg overflow-hidden h-48 flex items-center justify-center"
                          >
                            {photoPath &&
                            photoPath !==
                              "/images/acceptance/placeholder.jpg" ? (
                              <img
                                src={photoPath}
                                alt={`现场照片 ${photoNum}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setSelectedImage(photoPath)}
                              />
                            ) : (
                              <div className="text-center text-gray-500">
                                <div className="text-2xl mb-2">📷</div>
                                <p className="text-sm">现场照片 {photoNum}</p>
                                <p className="text-xs">待上传</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 右侧 1 列 - 人像 */}
                  <div className="col-span-1">
                    <div className="bg-gray-200 rounded-lg flex items-center justify-center h-full">
                      {acceptanceData.人像照片 &&
                      acceptanceData.人像照片 !==
                        "/images/acceptance/placeholder.jpg" ? (
                        <img
                          src={acceptanceData.人像照片}
                          alt="验收人员"
                          className="w-full h-full object-cover rounded-lg cursor-pointer"
                          onClick={() =>
                            setSelectedImage(acceptanceData.人像照片)
                          }
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <div className="text-4xl mb-2">👤</div>
                          <p className="text-lg font-medium">人像</p>
                          <p className="text-sm">待上传</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">暂无验收数据</p>
                  <p className="text-sm">该工序的验收信息尚未配置</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 图片查看大图弹窗 */}
        {selectedImage && (
          <Dialog
            open={!!selectedImage}
            onOpenChange={() => setSelectedImage(null)}
          >
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
