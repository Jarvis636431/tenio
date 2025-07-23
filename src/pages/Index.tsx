
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Activity, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";

const Index = () => {
  const navigate = useNavigate();
  const { projects } = useProject();

  const handleNewProject = () => {
    navigate("/new-project");
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="h-full p-6 py-[8px] px-[8px]">
      <div className="space-y-2 mb-6">
        <h1 className="tracking-tight text-xl font-medium">主页</h1>
        <p className="text-muted-foreground text-base font-light">
          欢迎使用天友智管平台，开始您的项目管理之旅
        </p>
      </div>

      <div className="w-full bg-card rounded-xl p-6 space-y-6 h-full flex flex-col px-[24px]">
        {/* 快速操作区 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNewProject}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-primary" />
                新建项目
              </CardTitle>
              <CardDescription>创建新的项目并开始管理</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/project-management")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                项目管理
              </CardTitle>
              <CardDescription>查看和管理所有项目</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                系统状态
              </CardTitle>
              <CardDescription>查看系统运行状态</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* 最近项目 */}
        {projects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">最近项目</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectProject(project.id)}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {project.name}
                    </CardTitle>
                    <CardDescription>
                      {project.hasBasicInfo ? "已完成基础信息" : "待完善信息"}
                    </CardDescription>
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
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">暂无项目</h3>
                <p className="text-muted-foreground">点击新建项目开始您的第一个项目</p>
              </div>
              <Button onClick={handleNewProject} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建项目
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
