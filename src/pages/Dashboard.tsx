import { Building2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "@/hooks/useProject";

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects } = useProject();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#020a1d] to-[#041332]">
      <div className="flex-1 overflow-auto px-6 py-6">
        {projects.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-medium text-cyan-100">项目列表</h2>
              <p className="text-sm text-cyan-400/70">
                选择一个已有项目进入总览页。
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer border-cyan-900/40 bg-[#071a39]/70 text-cyan-100 transition-colors hover:border-cyan-500/60 hover:bg-[#0b234b]"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <CardHeader className="py-5">
                    <CardTitle className="flex items-center gap-3 text-base">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-900/30">
                        <FileText className="h-5 w-5 text-cyan-300" />
                      </div>
                      <span className="truncate">{project.name}</span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 rounded-md flex items-center justify-center border border-cyan-900/40">
                <Building2 className="h-8 w-8 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-cyan-100">暂无可用项目</h3>
                <p className="text-cyan-400/70 text-sm max-w-md mx-auto leading-relaxed">
                  创建流程已移除，请通过后端或其他入口准备项目后再进入总览页。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
