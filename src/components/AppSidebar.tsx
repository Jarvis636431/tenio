import { NavLink, useLocation } from "react-router-dom";
import { PlusCircle, Settings, Building2, Menu, Home, Calendar, BarChart3, Activity, ShoppingCart, Users, MessageSquare, Info, Plus, User, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProjectSelector } from "@/components/ProjectSelector";
import { useProject } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import userAvatar from "@/assets/user-avatar.png";
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
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const { logout, user } = useAuth();

  const handleNewProject = () => {
    setNewProjectDialogOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return <TooltipProvider>
      <Sidebar className="border-r border-gray-200" collapsible="icon">
        <SidebarContent className="flex flex-col h-full">
          {/* 顶部公司Logo和名称 */}
          <SidebarHeader className="px-4 py-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 cursor-pointer transition-opacity hover:opacity-80" onClick={handleLogoClick}>
                <img src="/lovable-uploads/7fc2509c-786f-4b70-8fba-9cf0a66bc806.png" alt="天友" className="h-8 w-8" />
                {!isCollapsed && <h1 className="text-lg font-semibold text-slate-700">A.PM 智慧建管</h1>}
              </div>
              {/* 展开状态下显示收起按钮 */}
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md hover:bg-gray-100"
                  onClick={toggleSidebar}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SidebarHeader>

          {/* 主要内容区域 */}
          <div className="flex-1 overflow-y-auto py-1" style={isCollapsed ? { paddingLeft: '12px', paddingRight: '12px' } : { paddingLeft: '8px', paddingRight: '8px' }}>

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
          </div>

          {/* 底部新建项目按钮 */}
          <div className="px-4 py-2">
            {isCollapsed ? (
              <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default" size="icon" className="h-8 w-8" onClick={handleNewProject}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>新建项目</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Button variant="default" className="w-full justify-start gap-2" onClick={handleNewProject}>
                <Plus className="h-4 w-4" />
                新建项目
              </Button>
            )}
          </div>

          {/* 底部用户信息 */}
          <SidebarFooter className="px-4 py-4 border-t border-gray-200">
            {isCollapsed ? (
              <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userAvatar} alt="User" />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          {user?.name || '用户'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          设置
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          退出登录
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Jinzhou Liu</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start h-auto p-2">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={userAvatar} alt="User" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">Jinzhou Liu</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Jinzhou Liu
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    设置
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>
      <NewProjectDialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen} />
    </TooltipProvider>;
}