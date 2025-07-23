
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProject } from "@/contexts/ProjectContext";

interface ProjectSelectorProps {
  isCollapsed?: boolean;
}

export function ProjectSelector({ isCollapsed }: ProjectSelectorProps) {
  const navigate = useNavigate();
  const { currentProject, projects, setCurrentProject } = useProject();

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      navigate(`/project/${projectId}`);
    }
  };

  const handleNewProject = () => {
    navigate("/new-project");
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="flex items-center">
      {/* 项目下拉选择器 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex-1 justify-between h-9 px-3 font-normal border border-border bg-card">
            <span className="truncate">
              {currentProject?.name || "选择项目"}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] px-[4px] bg-card">
          {projects.map(project => (
            <DropdownMenuItem 
              key={project.id} 
              onClick={() => handleProjectSelect(project.id)} 
              className={cn("cursor-pointer", project.id === currentProject?.id && "bg-accent")}
            >
              {project.name}
              {project.id === currentProject?.id && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
          ))}
          {projects.length === 0 && (
            <DropdownMenuItem disabled>
              暂无项目
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleNewProject} className="cursor-pointer">
            新建项目
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
