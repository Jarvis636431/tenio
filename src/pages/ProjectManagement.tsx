import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, CheckCircle2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

// 模拟项目数据
const projects = [{
  id: 1,
  name: "办公楼建设项目",
  createdAt: "2024-01-10",
  taskCount: 15,
  orderCount: 8,
  status: "已完成"
}, {
  id: 2,
  name: "住宅小区A区项目",
  createdAt: "2024-02-15",
  taskCount: 23,
  orderCount: 12,
  status: "进行中"
}, {
  id: 3,
  name: "商业综合体项目",
  createdAt: "2024-03-20",
  taskCount: 31,
  orderCount: 18,
  status: "进行中"
}, {
  id: 4,
  name: "工业园区基础设施",
  createdAt: "2024-04-05",
  taskCount: 19,
  orderCount: 10,
  status: "规划中"
}, {
  id: 5,
  name: "学校扩建项目",
  createdAt: "2024-05-12",
  taskCount: 27,
  orderCount: 15,
  status: "进行中"
}];
export default function ProjectManagement() {
  const navigate = useNavigate();
  const getStatusColor = (status: string) => {
    switch (status) {
      case "已完成":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "进行中":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "规划中":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  const handleProjectClick = (projectId: number) => {
    navigate(`/project/${projectId}`);
  };
  return <div className="h-full p-6 py-[8px] px-[8px]">
      <div className="w-full bg-card rounded-xl shadow-sm p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="tracking-tight font-medium text-xl">项目管理</h1>
        <p className="text-muted-foreground font-light text-base">
          管理您的施工项目，上传CAD图纸自动生成进度表
        </p>
      </div>

      <div className="space-y-4">
        {projects.map(project => <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleProjectClick(project.id)}>
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
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>{project.taskCount} 个任务</span>
                    </div>
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
          </Card>)}
      </div>
      </div>
    </div>;
}