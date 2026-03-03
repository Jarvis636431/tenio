import { NavLink, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar() {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar className="border-r border-gray-200" collapsible="icon">
        <SidebarHeader className="px-4 py-4">
          <div
            className="flex items-center cursor-pointer transition-opacity hover:opacity-80"
            onClick={() => navigate("/")}
          >
            <img src="/logo.svg" alt="天友" className="h-8 w-8" />
            {!isCollapsed && (
              <h1 className="ml-3 text-lg font-semibold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                A.PM 智慧建管
              </h1>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to="/"
                      className="flex h-8 w-full items-center justify-center rounded-md hover:bg-accent"
                    >
                      <Home className="h-4 w-4 text-muted-foreground" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>主页</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuButton asChild>
                  <NavLink to="/">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      主页
                    </span>
                  </NavLink>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
