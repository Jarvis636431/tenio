import { NavLink, useLocation } from "react-router-dom";
import { PlusCircle, Settings, Building2, Menu, Home, Calendar, BarChart3, Activity, ShoppingCart, Users, MessageSquare, Info, Plus } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
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
  id: "plan-overview",
  label: "计划总览",
  icon: Calendar
}, {
  id: "real-time-monitoring",
  label: "实时监测",
  icon: Activity
}, {
  id: "order-management",
  label: "订单管理",
  icon: ShoppingCart
}, {
  id: "craftsman-management",
  label: "工匠管理",
  icon: Users
}, {
  id: "communication-collaboration",
  label: "沟通协作",
  icon: MessageSquare
}];
export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentProject
  } = useProject();
  const {
    state
  } = useSidebar();
  const isCollapsed = state === "collapsed";
  const currentPath = location.pathname;

  // 修复主页选中态逻辑
  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath === path;
  };
  const isProjectRoute = currentPath.startsWith('/project/');

  // 获取当前项目内的活跃视图
  const getActiveProjectView = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('view') || 'basic-info';
  };
  const isProjectViewActive = (viewId: string) => {
    return isProjectRoute && getActiveProjectView() === viewId;
  };

  // 项目导航是否应该显示：只要有当前项目就显示
  const shouldShowProjectNavigation = !!currentProject;
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const handleNewProject = () => {
    setNewProjectDialogOpen(true);
  };
  return <TooltipProvider>
      <Sidebar className="shadow-[2px_0_8px_rgba(0,0,0,0.06)] border-r-0" collapsible="icon">
        <SidebarContent className="py-[60px] bg-white px-[4px]">
          {/* 顶部新建项目按钮 */}
          <SidebarHeader className="px-3 pb-0">
            {isCollapsed ? <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default" size="icon" className="w-8 h-8 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleNewProject}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">新建项目</TooltipContent>
                </Tooltip>
              </div> : <Button variant="default" className="w-full justify-start h-9 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleNewProject}>
                <Plus className="mr-2 h-4 w-4" />
                新建项目
              </Button>}
          </SidebarHeader>

          {/* 主导航 */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map(item => <SidebarMenuItem key={item.title}>
                    {isCollapsed ? <div className="flex justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton asChild isActive={isActive(item.url)} className={isActive(item.url) ? "bg-[hsl(var(--sidebar-selected))] text-[hsl(var(--sidebar-selected-foreground))]" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}>
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 flex-shrink-0 text-slate-600" strokeWidth={1.5} />
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">{item.title}</TooltipContent>
                        </Tooltip>
                      </div> : <SidebarMenuButton asChild isActive={isActive(item.url)} className={isActive(item.url) ? "bg-[hsl(var(--sidebar-selected))] text-[hsl(var(--sidebar-selected-foreground))]" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}>
                        <NavLink to={item.url} className="my-0 py-[16px]">
                          <item.icon className="h-4 w-4 flex-shrink-0 text-slate-600" strokeWidth={1.5} />
                          <span className={`text-base ${isActive(item.url) ? 'font-medium' : 'font-light'}`}>
                            {item.title}
                          </span>
                        </NavLink>
                      </SidebarMenuButton>}
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* 分割线 - 收起状态下隐藏 */}
          {!isCollapsed && <div className="px-3 mb-2">
              <div className="h-px bg-sidebar-border opacity-50"></div>
            </div>}

          {/* 项目选择器 - 收起状态下隐藏 */}
          {!isCollapsed && <SidebarGroup className="py-0 my-0 px-0 mx-[4px]">
              <SidebarGroupContent>
                <div className="px-[12px] bg-transparent">
                  <ProjectSelector isCollapsed={isCollapsed} />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>}

          {/* 项目内导航 - 当有选中项目时常驻显示 */}
          {shouldShowProjectNavigation && <SidebarGroup className="my-0 py-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectMenuItems.map(item => {
                const Icon = item.icon;
                const isActiveView = isProjectViewActive(item.id);
                const projectUrl = `/project/${currentProject.id}?view=${item.id}`;
                return <SidebarMenuItem key={item.id}>
                        {isCollapsed ? <div className="flex justify-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SidebarMenuButton asChild isActive={isActiveView} className={isActiveView ? "bg-[hsl(var(--sidebar-selected))] text-[hsl(var(--sidebar-selected-foreground))]" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}>
                                  <NavLink to={projectUrl}>
                                    <Icon className="h-4 w-4 flex-shrink-0 text-slate-600" strokeWidth={1.5} />
                                  </NavLink>
                                </SidebarMenuButton>
                              </TooltipTrigger>
                              <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                          </div> : <SidebarMenuButton asChild isActive={isActiveView} className={isActiveView ? "bg-[hsl(var(--sidebar-selected))] text-[hsl(var(--sidebar-selected-foreground))]" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}>
                            <NavLink to={projectUrl} className="my-0 py-[16px]">
                              <Icon className="h-4 w-4 flex-shrink-0 text-slate-600" strokeWidth={1.5} />
                              <span className={`text-base ${isActiveView ? 'font-medium' : 'font-light'}`}>
                                {item.label}
                              </span>
                            </NavLink>
                          </SidebarMenuButton>}
                      </SidebarMenuItem>;
              })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>}
        </SidebarContent>

        <NewProjectDialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen} />
      </Sidebar>
    </TooltipProvider>;
}