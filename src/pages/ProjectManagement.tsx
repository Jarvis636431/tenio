
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useProject } from "@/contexts/ProjectContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { projects, isLoading } = useProject();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "已完成":
        return "bg-category-green-100 text-category-green-800 hover:bg-category-green-200";
      case "进行中":
        return "bg-category-blue-100 text-category-blue-800 hover:bg-category-blue-200";
      case "规划中":
        return "bg-category-yellow-100 text-category-yellow-800 hover:bg-category-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };
  
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="px-6 pt-6">
        <PageHeader title="项目管理" />
      </div>

      {/* 主内容区域 - 直接显示，无白色卡片包装 */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="h-full overflow-auto space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-gray-200">
              <CardContent className="p-6 flex flex-col gap-3">
                <Skeleton className="h-4 w-1/3" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : projects.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            暂无项目，请先创建项目。
          </div>
        ) : (
        projects.map(project => (
          <Card 
            key={project.id} 
            className="cursor-pointer transition-colors duration-300 border-gray-300 hover:bg-gray-50" 
            style={{borderWidth: '0.5px'}}
            onClick={() => handleProjectClick(project.id)}
          >
            <CardContent className="p-6 px-[16px] py-[16px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-normal text-base">{project.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-light text-sm">创建于 {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "未知"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span>项目进度</span>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className={getStatusColor(project.status || "进行中")}>
                    {project.status || "进行中"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )))}
        </div>
      </div>
    </div>
  );
}
