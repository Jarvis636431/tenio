
import { NavLink, useLocation, useParams } from "react-router-dom";
import { PlusCircle, Settings, Building2, Menu, Home, Calendar, BarChart3, Activity, ShoppingCart, Users, MessageSquare, Info } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/ProjectSelector";
import { cn } from "@/lib/utils";

const mainMenuItems = [
  {
    title: "主页",
    url: "/",
    icon: Home
  },
  {
    title: "项目管理", 
    url: "/project-management",
    icon: Settings
  }
];

const projectMenuItems = [
  {
    id: "basic-info",
    label: "基础信息",
    icon: Info
  },
  {
    id: "plan-overview", 
    label: "计划总览",
    icon: Calendar
  },
  {
    id: "real-time-monitoring",
    label: "实时监测", 
    icon: Activity
  },
  {
    id: "order-management",
    label: "订单管理",
    icon: ShoppingCart
  },
  {
    id: "craftsman-management",
    label: "工匠管理",
    icon: Users
  },
  {
    id: "communication-collaboration",
    label: "沟通协作",
    icon: MessageSquare
  }
];

export function AppSidebar() {
  const location = useLocation();
  const { id } = useParams();
  const currentPath = location.pathname;
  const { state, hoverMode, isHoverExpanded } = useSidebar();
  const isCollapsed = state === "collapsed";
  
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

  // 在hover模式且收起状态下显示icon，在hover展开或固定展开时显示完整内容
  const shouldShowFullContent = !isCollapsed || (hoverMode && isHoverExpanded);
  const shouldShowTooltip = isCollapsed && hoverMode && !isHoverExpanded;

  return (
    <TooltipProvider>
      <Sidebar className="bg-sidebar border-r" collapsible="icon">
        <SidebarHeader className={`p-4 py-[13.5px] flex flex-row items-center ${shouldShowFullContent ? 'justify-between' : 'justify-center'}`}>
          {shouldShowFullContent ? (
            <>
              <div className="flex items-center space-x-2">
                <Building2 className="h-6 w-6 text-primary flex-shrink-0" />
                <h1 className="text-lg font-bold text-primary">天友智管平台</h1>
              </div>
              <SidebarTrigger className="h-6 w-6 flex-shrink-0">
                <Menu className="h-4 w-4" />
              </SidebarTrigger>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="h-6 w-6 flex-shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </SidebarTrigger>
              </TooltipTrigger>
              <TooltipContent>展开侧边栏</TooltipContent>
            </Tooltip>
          )}
        </SidebarHeader>

        <SidebarContent>
          {/* 主导航 */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    {shouldShowTooltip ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton 
                            asChild 
                            isActive={isActive(item.url)}
                            style={isActive(item.url) ? {
                              '--sidebar-accent': 'hsl(0 0% 100%)',
                              '--sidebar-accent-foreground': 'hsl(0 0% 0%)',
                              backgroundColor: 'white',
                              color: 'black',
                              fontWeight: 'bold'
                            } as any : {}}
                          >
                            <NavLink to={item.url}>
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              {shouldShowFullContent && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent>{item.title}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        style={isActive(item.url) ? {
                          '--sidebar-accent': 'hsl(0 0% 100%)',
                          '--sidebar-accent-foreground': 'hsl(0 0% 0%)',
                          backgroundColor: 'white',
                          color: 'black',
                          fontWeight: 'bold'
                        } as any : {}}
                      >
                        <NavLink to={item.url}>
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {shouldShowFullContent && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* 分割线 */}
          <div className="px-3 mb-2">
            <div className="h-px bg-sidebar-border opacity-50"></div>
          </div>

          {/* 项目选择器 */}
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-2">
                <ProjectSelector isCollapsed={!shouldShowFullContent} />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* 项目内导航 */}
          {shouldShowFullContent && isProjectRoute && id && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>项目导航</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {projectMenuItems.map(item => {
                      const Icon = item.icon;
                      const isActiveView = isProjectViewActive(item.id);
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton 
                            asChild
                            isActive={isActiveView}
                            style={isActiveView ? {
                              '--sidebar-accent': 'hsl(0 0% 100%)',
                              '--sidebar-accent-foreground': 'hsl(0 0% 0%)',
                              backgroundColor: 'white',
                              color: 'black',
                              fontWeight: 'bold'
                            } as any : {}}
                          >
                            <NavLink to={`/project/${id}?view=${item.id}`}>
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>

        {/* 底部新建项目按钮 */}
        <SidebarFooter className="p-2">
          {shouldShowFullContent ? (
            <Button 
              asChild
              className="w-full justify-start"
              variant="outline"
            >
              <NavLink to="/new-project">
                <PlusCircle className="h-4 w-4 mr-2" />
                新建项目
              </NavLink>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  asChild
                  size="icon"
                  variant="outline"
                  className="w-10 h-10"
                >
                  <NavLink to="/new-project">
                    <PlusCircle className="h-4 w-4" />
                  </NavLink>
                </Button>
              </TooltipTrigger>
              <TooltipContent>新建项目</TooltipContent>
            </Tooltip>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
