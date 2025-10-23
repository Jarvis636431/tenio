
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";

// 模拟项目数据
const projects = [{
  id: 1,
  name: "办公楼建设项目",
  createdAt: "2024-01-10",
  orderCount: 156,
  status: "已完成"
}, {
  id: 2,
  name: "住宅小区A区项目",
  createdAt: "2024-02-15",
  orderCount: 234,
  status: "进行中"
}, {
  id: 3,
  name: "商业综合体项目",
  createdAt: "2024-03-20",
  orderCount: 189,
  status: "进行中"
}, {
  id: 4,
  name: "工业园区基础设施",
  createdAt: "2024-04-05",
  orderCount: 267,
  status: "规划中"
}, {
  id: 5,
  name: "学校扩建项目",
  createdAt: "2024-05-12",
  orderCount: 145,
  status: "进行中"
}];

export default function ProjectManagement() {
  const navigate = useNavigate();
  
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
  
  const handleProjectClick = (projectId: number) => {
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
        {projects.map(project => (
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
                      <span className="font-light text-sm">创建于 {project.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span>{project.orderCount} 个订单</span>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>
    </div>
  );
}
