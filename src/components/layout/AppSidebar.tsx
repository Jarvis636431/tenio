import { NavLink, useNavigate } from "react-router-dom";
import { Home, LogOut, Building2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useProjectStore } from "@/stores/projectStore";
import { TOKEN_STORAGE_KEY } from "@/services/user-service";

export function AppSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const resetProjectStore = useProjectStore((state) => state.reset);
  const projectQuickLinks = [
    { to: "/project/project_001", tooltip: "项目 001" },
  ];

  const handleLogout = () => {
    logout();
    resetProjectStore();
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    navigate("/login", { replace: true });
  };

  return (
    <aside className="h-full w-14 border-r border-cyan-900/40 bg-[#04142d]/85 backdrop-blur-sm">
      <TooltipProvider delayDuration={300}>
        <div className="flex h-full flex-col items-center py-4">
          <div
            className="mb-6 flex cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
            onClick={() => navigate("/")}
          >
            <img src="/logo.svg" alt="天友" className="h-8 w-8" />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/"
                className="flex h-8 w-8 items-center justify-center rounded-md text-cyan-200 hover:bg-cyan-900/40"
              >
                <Home className="h-4 w-4 text-cyan-200" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>主页</p>
            </TooltipContent>
          </Tooltip>

          <div className="mt-3 flex w-full flex-col items-center gap-2">
            {projectQuickLinks.map((item) => (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `mx-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                        isActive
                          ? "bg-cyan-900/40 text-cyan-200"
                          : "text-cyan-200 hover:bg-cyan-900/40"
                      }`
                    }
                  >
                    <Building2 className="h-4 w-4 text-cyan-200" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="mt-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-cyan-200 hover:bg-cyan-900/40"
                  aria-label="退出登录"
                >
                  <LogOut className="h-4 w-4 text-cyan-200" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>退出登录</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </aside>
  );
}
