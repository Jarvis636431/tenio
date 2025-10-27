import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Eye } from "lucide-react";
import { ModelViewer } from "@/components/ModelViewer";

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any; // TaskItem type
}

export function TaskDetailDialog({ open, onOpenChange, task }: TaskDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("3d");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!task) return null;

  // Mock data for demonstration
  const detailImages = [
    "/src/assets/大样 1.jpeg",
    "/src/assets/大样 3.jpeg",
    "/src/assets/图纸.jpeg"
  ];

  const tutorialVideo = "/src/assets/施工教程.mp4"; // Mock video path

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{task.task}</span>
            <Badge variant="outline">{task.specialty}</Badge>
            <Badge variant="secondary">{task.jobType}</Badge>
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
              src={task?.modelUrl}
              allowUpload
              className="h-full"
            />
          </TabsContent>

          <TabsContent value="drawings" className="mt-4 flex-1">
            <div className="h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📐</div>
                <p>平面图纸视口</p>
                <p className="text-sm">支持缩放查看</p>
                <p className="text-xs text-gray-400 mt-2">
                  支持缩放查看
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4 flex-1 overflow-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {detailImages.map((image, index) => (
                <div key={index} className="relative group cursor-pointer" onClick={() => setSelectedImage(image)}>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                    <div className="text-center text-gray-500">
                      <div className="text-2xl mb-1">📷</div>
                      <p className="text-sm">大样图 {index + 1}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="disclaimer" className="mt-4 flex-1 overflow-auto">
            <div className="prose max-w-none text-sm text-gray-700 space-y-3">
              <p><strong>施工安全注意事项：</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>砌筑材料（砖、砂浆、砌块）堆放稳固，距临边（如脚手架边缘、楼板边缘）不小于 1m，高度不超过 1.5m，防止倾倒；墙板堆放需立放并固定，避免侧翻。</li>
                <li>施工人员必须佩戴安全帽、安全带等防护用品，严禁酒后作业。</li>
                <li>高空作业时，必须设置安全防护网，确保施工安全。</li>
                <li>施工过程中如遇恶劣天气，应立即停止作业，确保人员安全。</li>
              </ul>
              <p><strong>质量要求：</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>严格按照设计图纸和施工规范进行施工。</li>
                <li>材料进场前必须进行质量检验，不合格材料严禁使用。</li>
                <li>施工过程中应进行质量自检，发现问题及时整改。</li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                * 本声明仅供参考，具体施工要求请以实际工程图纸和规范为准。
              </p>
            </div>
          </TabsContent>

          <TabsContent value="tutorial" className="mt-4 flex-1">
            <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🎥</div>
                <p>施工教程视频</p>
                <p className="text-sm">点击播放按钮开始观看</p>
                <Button className="mt-4" size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  播放视频
                </Button>
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
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>大图查看</p>
                  <p className="text-sm">支持缩放和拖拽</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
