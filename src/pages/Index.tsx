import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Building2,
  FileText,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/hooks/useProject";

const Index = () => {
  const navigate = useNavigate();
  const { projects } = useProject();

  const handleNewProject = () => {
    navigate("/create-project");
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* 主内容区域 - 直接显示，无白色卡片包装 */}
      <div className="flex-1 overflow-hidden px-6 pt-6 pb-6">
        <div className="h-full overflow-auto space-y-4">
          {/* Hero Section with Brand Gradient */}
          <div className="relative p-8 rounded-xl bg-gradient-to-br from-primary/10 via-primary-glow/5 to-transparent overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    A.PM 智慧建管
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    智能项目管理，让建设更高效
                  </p>
                </div>
              </div>
              <p className="text-foreground/80 text-sm leading-relaxed max-w-3xl">
                基于AI驱动的建筑项目管理平台，为您提供从规划到竣工的全流程数字化解决方案，实现项目管理的智能化升级。
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* 快速操作区 */}
            <div>
              <h2 className="text-base font-medium mb-3">快速操作</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Card
                  className="cursor-pointer transition-colors duration-200 border-primary/20 hover:border-primary/40 group bg-primary/5 hover:bg-primary/10 rounded-lg"
                  onClick={handleNewProject}
                >
                  <CardHeader className="py-6">
                    <CardTitle className="flex items-center gap-3 text-lg ml-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center text-white">
                        <Plus className="h-5 w-5" />
                      </div>
                      新建项目
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card
                  className="cursor-pointer transition-colors duration-200 border-success/20 hover:border-success/40 group bg-success/5 hover:bg-success/10 rounded-lg"
                  onClick={() => navigate("/project-management")}
                >
                  <CardHeader className="py-6">
                    <CardTitle className="flex items-center gap-3 text-lg ml-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center text-white">
                        <Building2 className="h-5 w-5" />
                      </div>
                      项目管理
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* 系统状态卡片已移除 */}
              </div>
            </div>

            {/* 最近项目 */}
            {projects.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-medium">最近项目</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {projects.slice(0, 6).map((project) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer transition-colors duration-200 border-border hover:border-primary/30 hover:bg-muted/30 group rounded-lg"
                      onClick={() => handleSelectProject(project.id)}
                    >
                      <CardHeader className="py-6">
                        <CardTitle className="flex items-center gap-3 text-lg ml-4">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          {project.name}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 空状态 */}
            {projects.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/10 to-primary-glow/10 rounded-md flex items-center justify-center border border-primary/20">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">开始您的第一个项目</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                      创建项目，体验AI驱动的智能建管平台，让项目管理变得更简单高效
                    </p>
                  </div>
                  <Button
                    onClick={handleNewProject}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-white transition-all duration-200"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    新建项目
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
