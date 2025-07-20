
import { NavLink, useLocation } from "react-router-dom";
import { FolderPlus, Settings, Building2, PlusCircle, Menu } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarSeparator, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? "!bg-white !text-black !font-bold" : "hover:bg-accent";

      return <Sidebar className="bg-sidebar border-r" collapsible="icon">
      <SidebarHeader className="p-4 py-[13.5px] flex flex-row items-center justify-between">
        {isCollapsed ? (
          <SidebarTrigger className="h-6 w-6 flex-shrink-0">
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-primary flex-shrink-0" />
              <h1 className="text-lg font-bold text-primary">天友智管平台</h1>
            </div>
            <SidebarTrigger className="h-6 w-6 flex-shrink-0">
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
          </>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({ isActive }) => getNavCls({ isActive })}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-3 mb-2">
          <div className="h-px bg-sidebar-border opacity-50"></div>
        </div>

        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>项目列表</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map(project => <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton asChild>
                    <NavLink to={project.url} className={({ isActive }) => getNavCls({ isActive })}>
                      <FolderPlus className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span>{project.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}
