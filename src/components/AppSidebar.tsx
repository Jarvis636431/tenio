
import { NavLink, useLocation } from "react-router-dom";
import { PlusCircle, Settings, Building2, Menu } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const mainMenuItems = [{
  title: "新建项目",
  url: "/new-project",
  icon: PlusCircle
}, {
  title: "项目管理",
  url: "/project-management",
  icon: Settings
}];

// 模拟项目数据
const projects = [{
  id: "1",
  name: "办公楼建设项目",
  url: "/project/1"
}, {
  id: "2",
  name: "项目 2",
  url: "/project/2"
}];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state, hoverMode, isHoverExpanded } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const isActive = (path: string) => currentPath === path;

  // 在hover模式且收起状态下显示icon，在hover展开或固定展开时显示完整内容
  const shouldShowFullContent = !isCollapsed || (hoverMode && isHoverExpanded);
  const shouldShowTooltip = isCollapsed && hoverMode && !isHoverExpanded;

  return <TooltipProvider>
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
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {mainMenuItems.map(item => <SidebarMenuItem key={item.title}>
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
              </SidebarMenuItem>)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {shouldShowFullContent && (
        <>
          <div className="px-3 mb-2">
            <div className="h-px bg-sidebar-border opacity-50"></div>
          </div>

          <SidebarGroup>
            <SidebarGroupLabel>项目列表</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.map(project => <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(project.url)}
                      style={isActive(project.url) ? {
                        '--sidebar-accent': 'hsl(0 0% 100%)',
                        '--sidebar-accent-foreground': 'hsl(0 0% 0%)',
                        backgroundColor: 'white',
                        color: 'black',
                        fontWeight: 'bold'
                      } as any : {}}
                    >
                      <NavLink to={project.url}>
                        <span>{project.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </>
      )}
    </SidebarContent>
  </Sidebar>
  </TooltipProvider>;
}
