import { useState } from "react";
import { Upload, FileText, Cloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import { precreateProject } from "@/services/project-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const [projectDoc, setProjectDoc] = useState<File | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'confirm' | 'generating'>('upload');
  
  // 项目基础信息状态
  const [projectInfo, setProjectInfo] = useState({
    name: "",
    location: "河北省石家庄市",
    floors: "小高层住宅 11 层",
    heightDiff: "0.6 米",
    structure: "剪力墙",
    structureSystem: "剪力墙结构体系",
    safetyLevel: "二级"
  });
  
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

  const handleNextStep = () => {
    if (!projectName.trim()) {
      toast({
        title: "请完善信息",
        description: "请输入项目名称",
        variant: "destructive"
      });
      return;
    }
    // 同步项目名称到项目信息中
    setProjectInfo(prev => ({ ...prev, name: projectName.trim() }));
    setCurrentStep('confirm');
  };

  const handleGenerateProcess = async () => {
    setCurrentStep('generating');
    setIsCreating(true);
    
    toast({
      title: "正在解析项目信息",
      description: "系统正在分析上传的文件，请稍候..."
    });
    
    try {
      const payload = {
        project_name: projectInfo.name.trim() || projectName.trim(),
      };

      const response = await precreateProject(payload);
      
      // 模拟解析过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newProjectId = response.project_id;
      const newProject = {
        id: newProjectId,
        name: projectInfo.name.trim() || projectName.trim(),
        hasBasicInfo: true,
        status: response.status,
      };
      
      // 添加到项目列表并设置为当前项目
      addProject(newProject);
      setCurrentProject(newProject);
      
      toast({
        title: "项目创建成功",
        description: `项目"${projectInfo.name.trim() || projectName}"已成功创建（状态：${response.status || "precreated"}）`
      });
      
      // 重置表单
      setProjectName("");
      setProjectDoc(null);
      setCadFile(null);
      setProjectInfo({
        name: "",
        location: "河北省石家庄市",
        floors: "小高层住宅 11 层",
        heightDiff: "0.6 米",
        structure: "剪力墙",
        structureSystem: "剪力墙结构体系",
        safetyLevel: "二级"
      });
      setCurrentStep('upload');
      
      // 关闭弹窗
      onOpenChange(false);
      
      // 导航到新项目的首页
      navigate(`/project/${newProjectId}`);
    } catch (error) {
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "项目创建过程中出现错误，请重试",
        variant: "destructive"
      });
      setCurrentStep('confirm');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    setCurrentStep('upload');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg">新建项目</DialogTitle>
        </DialogHeader>

        {currentStep === 'confirm' && (
          <div className="p-4 bg-category-blue-50 border border-category-blue-200 rounded-md mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-category-blue-600 rounded-full mt-2"></div>
              </div>
              <div className="text-sm text-category-blue-800">
                <p className="font-medium mb-1">系统已解析项目基础信息</p>
                <p>请确认以上信息无误后，点击"生成工序"开始创建施工工序计划。</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'upload' && (
          <div className="space-y-6">
            {/* 项目名称输入 */}
            <div className="space-y-2">
              <Label htmlFor="project-name">项目名称</Label>
              <Input 
                id="project-name" 
                placeholder="请输入项目名称" 
                value={projectName} 
                onChange={e => setProjectName(e.target.value)} 
              />
            </div>

            {/* CAD图纸上传 */}
            <div className="space-y-2">
              <Label>CAD图纸</Label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                onDrop={e => handleDrop(e, setCadFile, ['.dwg', '.dwf', '.dxf'])} 
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('cad-file')?.click()}
              >
                {!cadFile && (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">点击上传CAD图纸文件</p>
                  </>
                )}
                {cadFile && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 truncate w-full text-left">{cadFile.name}</p>
                    <Button variant="destructive" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleFileDelete(setCadFile);
                    }}>
                      删除
                    </Button>
                  </div>
                )}
                <input 
                  type="file" 
                  accept=".dwg,.dwf,.dxf" 
                  onChange={e => handleFileUpload(e, setCadFile)} 
                  className="hidden" 
                  id="cad-file" 
                />
              </div>
            </div>

            {/* 项目说明文件上传 */}
            <div className="space-y-2">
              <Label>项目说明文件</Label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                onDrop={e => handleDrop(e, setProjectDoc, ['.pdf', '.doc', '.docx'])} 
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('project-doc')?.click()}
              >
                {!projectDoc && (
                  <>
                    <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">点击上传项目说明文档</p>
                  </>
                )}
                {projectDoc && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 truncate w-full text-left">{projectDoc.name}</p>
                    <Button variant="destructive" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleFileDelete(setProjectDoc);
                    }}>
                      删除
                    </Button>
                  </div>
                )}
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  onChange={e => handleFileUpload(e, setProjectDoc)} 
                  className="hidden" 
                  id="project-doc" 
                />
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button 
                onClick={handleNextStep} 
                disabled={!projectName.trim()}
              >
                下一步
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'confirm' && (
          <div className="space-y-6">
            {/* 项目基础信息 */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name-edit">项目名称</Label>
                  <Input 
                    id="project-name-edit"
                    value={projectInfo.name}
                    onChange={(e) => setProjectInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-location">建设地点</Label>
                  <Input 
                    id="project-location"
                    value={projectInfo.location}
                    onChange={(e) => setProjectInfo(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-floors">层数</Label>
                  <Input 
                    id="project-floors"
                    value={projectInfo.floors}
                    onChange={(e) => setProjectInfo(prev => ({ ...prev, floors: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-height-diff">室内外高差</Label>
                  <Input 
                    id="project-height-diff"
                    value={projectInfo.heightDiff}
                    onChange={(e) => setProjectInfo(prev => ({ ...prev, heightDiff: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-structure">结构形式</Label>
                  <Input 
                    id="project-structure"
                    value={projectInfo.structure}
                    onChange={(e) => setProjectInfo(prev => ({ ...prev, structure: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-structure-system">结构体系</Label>
                  <Input 
                    id="project-structure-system"
                    value={projectInfo.structureSystem}
                    onChange={(e) => setProjectInfo(prev => ({ ...prev, structureSystem: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="project-safety-level">建筑结构安全等级</Label>
                  <Input 
                    id="project-safety-level"
                    value={projectInfo.safetyLevel}
                    onChange={(e) => setProjectInfo(prev => ({ ...prev, safetyLevel: e.target.value }))}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>
                上一步
              </Button>
              <Button onClick={handleGenerateProcess} disabled={isCreating}>
                生成工序
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'generating' && (
          <div className="space-y-6">
            <Card className="bg-white border border-dashed border-primary/30">
              <CardHeader>
                <CardTitle>正在生成施工工序</CardTitle>
                <CardDescription>系统正在分析上传文件并生成施工计划，请稍候...</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Cloud className="h-8 w-8 text-primary animate-pulse" />
                  <div>
                    <p className="font-medium">文件解析中...</p>
                    <p className="text-sm text-muted-foreground">系统会根据上传的CAD图纸和说明文档生成完整的施工工序和资源计划。</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-primary animate-pulse" />
                  <div>
                    <p className="font-medium">施工图纸生成中...</p>
                    <p className="text-sm text-muted-foreground">将构建项目的施工图纸信息和BIM模型，生成可视化的施工流程。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep !== 'generating' && (
          <DialogDescription>
            请填写项目的基础信息，后续可在项目详情中补充更多内容。
          </DialogDescription>
        )}
      </DialogContent>
    </Dialog>
  );
}
