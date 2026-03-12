import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, LogOut, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProjectStore } from "@/stores/projectStore";
import { TOKEN_STORAGE_KEY } from "@/services/user-service";
import { getProjectByCode } from "@/services/project-service";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const resetProjectStore = useProjectStore((state) => state.reset);
  const projects = useProjectStore((state) => state.projects);
  const addProject = useProjectStore((state) => state.addProject);
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);
  const projectQuickLinks = [
    { code: "project_001" },
  ];

  const handleLogout = () => {
    logout();
    resetProjectStore();
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    navigate("/login", { replace: true });
  };

  const handleProjectNavigate = async (projectCode: string) => {
    const localProject = projects.find(
      (project) => project.code === projectCode || project.id === projectCode,
    );
    if (localProject) {
      setCurrentProject(localProject);
      navigate(`/project/${localProject.id}`);
      return;
    }

    try {
      const response = await getProjectByCode(projectCode, token || undefined);
      const resolvedProject = {
        id: response.project_id,
        code: response.project_code ?? projectCode,
        name: response.project_name ?? projectCode,
        description: response.description,
        status: response.status,
        createdAt: response.created_at,
      };
      addProject(resolvedProject);
      setCurrentProject(resolvedProject);
      navigate(`/project/${response.project_id}`);
    } catch {
      navigate(`/project/${projectCode}`);
    }
  };

  return (
    <aside className="h-full w-14 border-r border-cyan-900/40 bg-[#04142d]/85 backdrop-blur-sm">
      <div className="flex h-full flex-col items-center py-4">
        <div
          className="mb-6 flex cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
          onClick={() => navigate("/")}
        >
          <img src="/logo.svg" alt="天友" className="h-8 w-8" />
        </div>

        <NavLink
          to="/"
          className="flex h-8 w-8 items-center justify-center rounded-md text-cyan-200 hover:bg-cyan-900/40"
        >
          <Home className="h-4 w-4 text-cyan-200" />
        </NavLink>

        <div className="mt-3 flex w-full flex-col items-center gap-2">
          {projectQuickLinks.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => void handleProjectNavigate(item.code)}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                location.pathname.startsWith("/project/")
                  ? "bg-cyan-900/40 text-cyan-200"
                  : "text-cyan-200 hover:bg-cyan-900/40"
              }`}
            >
              <Building2 className="h-4 w-4 text-cyan-200" />
            </button>
          ))}
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
