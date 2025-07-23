import { useState } from "react";
import { Upload, FileText, Wrench, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const [bidNotice, setBidNotice] = useState<File | null>(null);
  const [controlPrice, setControlPrice] = useState("");
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setCurrentProject, addProject } = useProject();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void) => {
    const file = event.target.files?.[0] || null;
    setter(file);
  };

  const handleFileDelete = (setter: (file: File | null) => void) => {
    setter(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, setter: (file: File | null) => void, acceptedTypes: string[]) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (acceptedTypes.includes(fileExtension)) {
        setter(file);
      } else {
        toast({
          title: "文件格式不支持",
          description: `请上传 ${acceptedTypes.join(' 或 ')} 格式的文件`,
          variant: "destructive"
        });
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleStartAnalysis = async () => {
    if (!bidNotice || !controlPrice || !cadFile) {
      toast({
        title: "请完善信息",
        description: "请上传所需文件并输入内部控制价",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    toast({
      title: "开始解析",
      description: "正在解析项目文件，请稍候..."
    });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newProjectId = Math.floor(Math.random() * 1000) + Date.now();
      const newProject = {
        id: newProjectId.toString(),
        name: `新建项目 ${newProjectId}`,
        hasBasicInfo: false
      };
      
      // 添加到项目列表并设置为当前项目
      addProject(newProject);
      setCurrentProject(newProject);
      
      toast({
        title: "项目创建成功",
        description: `项目已成功创建，文件解析完成`
      });
      
      // 重置表单
      setBidNotice(null);
      setControlPrice("");
      setCadFile(null);
      
      // 关闭弹窗
      onOpenChange(false);
      
      // 导航到新项目的计划总览页面
      navigate(`/project/${newProjectId}?view=plan-overview`);
    } catch (error) {
      toast({
        title: "创建失败",
        description: "项目创建过程中出现错误，请重试",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] w-full">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl">新建项目</SheetTitle>
          <SheetDescription>
            上传项目文件并设置基础信息以开始项目管理
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full pb-6">
          {/* 第一行：两列布局 */}
          <div className="grid gap-6 md:grid-cols-2 flex-1 mb-6">
            {/* CAD 文件上传 */}
            <Card className="h-full flex flex-col shadow-none border border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5 text-primary" />
                  CAD 图纸
                </CardTitle>
                <CardDescription className="text-sm">用于识别建筑类型和结构类型</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors h-full flex flex-col justify-center" onDrop={e => handleDrop(e, setCadFile, ['.dwg', '.dxf'])} onDragOver={handleDragOver}>
                    {!cadFile && <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {cadFile ? cadFile.name : "点击或拖拽上传 DWG 或 DXF 文件"}
                      </p>
                      <input type="file" accept=".dwg,.dxf" onChange={e => handleFileUpload(e, setCadFile)} className="hidden" id="cad-file" />
                      {cadFile ? (
                        <Button variant="destructive" type="button" onClick={() => handleFileDelete(setCadFile)}>
                          删除
                        </Button>
                      ) : (
                        <Label htmlFor="cad-file" className="cursor-pointer">
                          <Button variant="outline" type="button">
                            选择文件
                          </Button>
                        </Label>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 右侧列：中标通知书和内部控制价 */}
            <div className="h-full flex flex-col space-y-6">
              {/* 中标通知书上传 */}
              <Card className="flex-1 flex flex-col shadow-none border border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    中标通知书
                  </CardTitle>
                  <CardDescription className="text-sm">用于识别项目城市，建筑类型，中标金额</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors h-full flex flex-col justify-center" onDrop={e => handleDrop(e, setBidNotice, ['.pdf'])} onDragOver={handleDragOver}>
                      {!bidNotice && <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {bidNotice ? bidNotice.name : "点击或拖拽上传 PDF 文件"}
                        </p>
                        <input type="file" accept=".pdf" onChange={e => handleFileUpload(e, setBidNotice)} className="hidden" id="bid-notice" />
                        {bidNotice ? (
                          <Button variant="destructive" type="button" onClick={() => handleFileDelete(setBidNotice)}>
                            删除
                          </Button>
                        ) : (
                          <Label htmlFor="bid-notice" className="cursor-pointer">
                            <Button variant="outline" type="button">
                              选择文件
                            </Button>
                          </Label>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 内部控制价 */}
              <Card className="flex-1 flex flex-col shadow-none border border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wrench className="h-5 w-5 text-primary" />
                    内部控制价
                  </CardTitle>
                  <CardDescription className="text-sm">设置项目的内部控制价百分比</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="control-price">控制价百分比</Label>
                      <div className="relative">
                        <Input id="control-price" type="number" placeholder="输入百分比" value={controlPrice} onChange={e => setControlPrice(e.target.value)} className="pr-8" />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        例如：95 表示控制价为投标价的 95%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 第二行：解析按钮 */}
          <div className="flex flex-col items-center space-y-4 pt-4 border-t">
            <Button onClick={handleStartAnalysis} size="lg" disabled={!bidNotice || !controlPrice || !cadFile || isCreating} className="px-12">
              <Play className="mr-2 h-4 w-4" />
              {isCreating ? "正在创建..." : "开始解析"}
            </Button>
            <p className="text-muted-foreground text-sm text-center">
              完成上述文件上传后，点击开始解析生成项目
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}