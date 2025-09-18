import { NavLink, useLocation } from "react-router-dom";
import { PlusCircle, Settings, Building2, Menu, Home, Calendar, BarChart3, Activity, ShoppingCart, Users, MessageSquare, Info, Plus } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProjectSelector } from "@/components/ProjectSelector";
import { useProject } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { useState } from "react";
const mainMenuItems = [{
  title: "主页",
  url: "/",
  icon: Home
}, {
  title: "项目管理",
  url: "/project-management",
  icon: Settings
}];
const projectMenuItems = [{
  id: "basic-info",
  label: "基础信息",
  icon: Info
}, {
  id: "plan-and-orders",
  label: "施工总览",
  icon: Calendar
}, {
  id: "real-time-monitoring",
  label: "实时监测",
  icon: Activity
}, {
  id: "craftsman-management",
  label: "工匠管理",
  icon: Users
}];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);

  const handleNewProject = () => {
    setNewProjectDialogOpen(true);
  };
  return <TooltipProvider>
      <Sidebar className="border-r border-gray-200" collapsible="icon">
        <SidebarContent className="py-[60px]" style={isCollapsed ? { paddingLeft: '12px', paddingRight: '12px' } : { paddingLeft: '8px', paddingRight: '8px' }}>
          {/* 顶部新建项目按钮 */}
          <SidebarHeader className={isCollapsed ? "px-0 pb-0" : "px-3 pb-0"}>
            {isCollapsed ? <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-white hover:bg-gray-50" onClick={handleNewProject}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>新建项目</p>
                  </TooltipContent>
                </Tooltip>
              </div> : <Button variant="outline" className="w-full justify-start gap-2 bg-white hover:bg-gray-50" onClick={handleNewProject}>
                <Plus className="h-4 w-4" />
                新建项目
              </Button>}
          </SidebarHeader>

          {/* 主导航菜单 - 移除SidebarGroupLabel */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item) => {
                  const Icon = item.icon;
                  return <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                        <NavLink to={item.url}>
                          <Icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>;
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* 分割线 */}
          <Separator className="mx-4 my-2" />

          {/* 项目选择器 */}
          {!isCollapsed && <SidebarGroup className="py-0 my-0">
              <SidebarGroupContent>
                <div className="bg-transparent">
                  <ProjectSelector isCollapsed={isCollapsed} />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>}

          {/* 项目相关菜单 - 移除SidebarGroupLabel */}
          {currentProject && <SidebarGroup className="pt-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.search.includes(`view=${item.id}`);
                    return <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <NavLink to={`/project/${currentProject.id}?view=${item.id}`}>
                            <Icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>;
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>}
        </SidebarContent>
        {/* 移除SidebarFooter和SidebarTrigger */}
      </Sidebar>
      <NewProjectDialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen} />
    </TooltipProvider>;
}