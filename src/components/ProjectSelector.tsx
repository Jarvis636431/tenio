
import { ChevronDown, Building2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Building2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56">
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleProjectSelect(project.id)}
              className={cn(
                "cursor-pointer",
                project.id === currentProject?.id && "bg-accent"
              )}
            >
              <Building2 className="mr-2 h-4 w-4" />
              {project.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleNewProject} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between h-10 px-3 font-normal"
        >
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {currentProject?.name || "暂无项目"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => handleProjectSelect(project.id)}
            className={cn(
              "cursor-pointer",
              project.id === currentProject?.id && "bg-accent"
            )}
          >
            <Building2 className="mr-2 h-4 w-4" />
            {project.name}
            {project.id === currentProject?.id && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleNewProject} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
