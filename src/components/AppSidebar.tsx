import { NavLink, useLocation } from "react-router-dom";
import { PlusCircle, Settings, Building2, Menu, Home, Calendar, BarChart3, Activity, ShoppingCart, Users, MessageSquare, Info } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/ProjectSelector";
import { useProject } from "@/contexts/ProjectContext";
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
  const {
    currentProject
  } = useProject();
  const {
    state
  } = useSidebar();
  const isCollapsed = state === "collapsed";
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
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
  return <TooltipProvider>
      <Sidebar className="bg-sidebar border-r" collapsible="icon">
        

        <SidebarContent className="py-[60px]">
          {/* 主导航 */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map(item => <SidebarMenuItem key={item.title}>
                    {isCollapsed ? <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild isActive={isActive(item.url)} style={isActive(item.url) ? {
                      '--sidebar-accent': 'hsl(0 0% 100%)',
                      '--sidebar-accent-foreground': 'hsl(0 0% 0%)',
                      backgroundColor: 'white',
                      color: 'black',
                      fontWeight: 'bold'
                    } as any : {}}>
                            <NavLink to={item.url}>
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip> : <SidebarMenuButton asChild isActive={isActive(item.url)} style={isActive(item.url) ? {
                  '--sidebar-accent': 'hsl(0 0% 100%)',
                  '--sidebar-accent-foreground': 'hsl(0 0% 0%)',
                  backgroundColor: 'white',
                  color: 'black',
                  fontWeight: 'bold'
                } as any : {}}>
                        <NavLink to={item.url}>
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span>{item.title}</span>
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
          {!isCollapsed && <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-2">
                  <ProjectSelector isCollapsed={isCollapsed} />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>}

          {/* 项目内导航 - 当有选中项目时常驻显示 */}
          {shouldShowProjectNavigation && <SidebarGroup>
              {!isCollapsed}
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectMenuItems.map(item => {
                const Icon = item.icon;
                const isActiveView = isProjectViewActive(item.id);
                const projectUrl = `/project/${currentProject.id}?view=${item.id}`;
                return <SidebarMenuItem key={item.id}>
                        {isCollapsed ? <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton asChild isActive={isActiveView} style={isActiveView ? {
                        '--sidebar-accent': 'hsl(0 0% 100%)',
                        '--sidebar-accent-foreground': 'hsl(0 0% 0%)',
                        backgroundColor: 'white',
                        color: 'black',
                        fontWeight: 'bold'
                      } as any : {}}>
                                <NavLink to={projectUrl}>
                                  <Icon className="h-4 w-4 flex-shrink-0" />
                                </NavLink>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                          </Tooltip> : <SidebarMenuButton asChild isActive={isActiveView} style={isActiveView ? {
                    '--sidebar-accent': 'hsl(0 0% 100%)',
                    '--sidebar-accent-foreground': 'hsl(0 0% 0%)',
                    backgroundColor: 'white',
                    color: 'black',
                    fontWeight: 'bold'
                  } as any : {}}>
                            <NavLink to={projectUrl}>
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuButton>}
                      </SidebarMenuItem>;
              })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>}
        </SidebarContent>

        {/* 底部新建项目按钮 */}
        <SidebarFooter className="p-2">
          {!isCollapsed ? <Button asChild className="w-full justify-start" variant="outline">
              
            </Button> : <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon" variant="outline" className="w-8 h-8 mx-auto">
                  <NavLink to="/new-project">
                    <PlusCircle className="h-4 w-4" />
                  </NavLink>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">新建项目</TooltipContent>
            </Tooltip>}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>;
}