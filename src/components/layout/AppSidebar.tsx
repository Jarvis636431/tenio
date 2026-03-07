import { NavLink, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="h-full w-14 border-r border-gray-200 bg-white">
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
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              >
                <Home className="h-4 w-4 text-muted-foreground" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>主页</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </aside>
  );
}
