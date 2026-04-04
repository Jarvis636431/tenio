import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProjectStore } from "@/stores/projectStore";
import { TOKEN_STORAGE_KEY } from "@/services/user-service";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const resetProjectStore = useProjectStore((state) => state.reset);
  const currentProject = useProjectStore((state) => state.currentProject);

  const handleLogout = () => {
    logout();
    resetProjectStore();
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    navigate("/login", { replace: true });
  };

  const handleProjectNavigate = () => {
    if (currentProject?.id) {
      navigate(`/project/${currentProject.id}`);
      return;
    }
    navigate("/", { replace: true });
  };

  const isProjectQuickLinkActive = Boolean(currentProject?.id && location.pathname === `/project/${currentProject.id}`);

  return (
    <aside className="h-full w-14 border-r border-cyan-900/40 bg-[#04142d]/85 backdrop-blur-sm">
      <div className="flex h-full flex-col items-center py-4">
        <div className="mb-6 flex items-center justify-center">
          <img src="/logo.svg" alt="天友" className="h-8 w-8" />
        </div>

        <div className="mt-1 flex w-full flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleProjectNavigate}
            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              isProjectQuickLinkActive
                ? "bg-cyan-900/40 text-cyan-200"
                : "text-cyan-200 hover:bg-cyan-900/40"
            }`}
          >
            <Building2 className="h-4 w-4 text-cyan-200" />
          </button>
        </div>

        <div className="mt-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-md text-cyan-200 hover:bg-cyan-900/40"
            aria-label="退出登录"
          >
            <LogOut className="h-4 w-4 text-cyan-200" />
          </button>
        </div>
      </div>
    </aside>
  );
}
