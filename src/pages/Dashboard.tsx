import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleNewProject = () => {
    navigate("/create");
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#020a1d] to-[#041332]">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 rounded-md flex items-center justify-center border border-cyan-900/40">
            <Building2 className="h-8 w-8 text-cyan-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-cyan-100">开始您的第一个项目</h3>
            <p className="text-cyan-400/70 text-sm max-w-md mx-auto leading-relaxed">
              创建项目，体验AI驱动的智能建管平台，让项目管理变得更简单高效
            </p>
          </div>
          <Button
            onClick={handleNewProject}
            size="lg"
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;