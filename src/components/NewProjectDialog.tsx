import { useState } from "react";
import { Upload, FileText, Cloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
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

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "请完善信息",
        description: "请输入项目名称",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    toast({
      title: "创建项目",
      description: "正在创建项目，请稍候..."
    });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newProjectId = Math.floor(Math.random() * 1000) + Date.now();
      const newProject = {
        id: newProjectId.toString(),
        name: projectName.trim(),
        hasBasicInfo: false
      };
      
      // 添加到项目列表并设置为当前项目
      addProject(newProject);
      setCurrentProject(newProject);
      
      toast({
        title: "项目创建成功",
        description: `项目"${projectName}"已成功创建`
      });
      
      // 重置表单
      setProjectName("");
      setProjectDoc(null);
      setCadFile(null);
      
      // 关闭弹窗
      onOpenChange(false);
      
      // 导航到新项目的基础信息页面
      navigate(`/project/${newProjectId}?view=basic-info`);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">创建新项目</DialogTitle>
        </DialogHeader>

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

          {/* 文件上传区域 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* 上传项目文档 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">上传项目文档</span>
              </div>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                onDrop={e => handleDrop(e, setProjectDoc, ['.pdf', '.doc', '.docx'])} 
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('project-doc')?.click()}
              >
                {!projectDoc && <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {projectDoc ? projectDoc.name : "上传项目文档"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持PDF、DOC、DOCX等格式
                  </p>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={e => handleFileUpload(e, setProjectDoc)} 
                    className="hidden" 
                    id="project-doc" 
                  />
                  {projectDoc && (
                    <Button variant="destructive" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleFileDelete(setProjectDoc);
                    }}>
                      删除
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 上传CAD文件 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">上传CAD文件</span>
              </div>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                onDrop={e => handleDrop(e, setCadFile, ['.dwg', '.dwf', '.dxf'])} 
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('cad-file')?.click()}
              >
                {!cadFile && <Cloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {cadFile ? cadFile.name : "上传CAD文件或广联达模型文件"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持DWG、DWF、DXF等格式
                  </p>
                  <input 
                    type="file" 
                    accept=".dwg,.dwf,.dxf" 
                    onChange={e => handleFileUpload(e, setCadFile)} 
                    className="hidden" 
                    id="cad-file" 
                  />
                  {cadFile && (
                    <Button variant="destructive" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleFileDelete(setCadFile);
                    }}>
                      删除
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 创建按钮 */}
          <div className="flex justify-end">
            <Button 
              onClick={handleCreateProject} 
              disabled={!projectName.trim() || isCreating}
              className="px-8"
            >
              {isCreating ? "创建中..." : "创建项目"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}