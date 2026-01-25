import { NavLink, useLocation } from "react-router-dom";
import {
  Settings,
  Home,
  Calendar,
  BarChart3,
  Activity,
  Users,
  Info,
  Plus,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ClipboardList,
  Package,
  Wrench,
  CheckCircle,
  BookOpen,
  MessageCircleQuestion,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useProject } from "@/hooks/useProject";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import userAvatar from "@/assets/user-avatar.png";
import { cn } from "@/lib/utils";
const mainMenuItems = [
  {
    title: "主页",
    url: "/",
    icon: Home,
  },
  {
    title: "项目管理",
    url: "/project-management",
    icon: Settings,
  },
];
const projectMenuItems = [
  {
    id: "basic-info",
    label: "基础信息",
    icon: Info,
  },
  {
    id: "plan",
    label: "施工总览",
    icon: ClipboardList,
    subItems: [
      {
        id: "overview",
        label: "任务总览",
        icon: Calendar,
      },
      {
        id: "gantt",
        label: "施工甘特图",
        icon: BarChart3,
      },
      {
        id: "network",
        label: "施工网络图",
        icon: Activity,
      },
    ],
  },
  {
    id: "monitoring",
    label: "实时监测",
    icon: Activity,
    subItems: [
      {
        id: "labor",
        label: "施工人数",
        icon: Users,
      },
      {
        id: "cost",
        label: "人工成本",
        icon: DollarSign,
      },
    ],
  },
  {
    id: "craftsman",
    label: "工匠管理",
    icon: Users,
  },
  {
    id: "funding",
    label: "资金物料",
    icon: Package,
  },
  {
    id: "toolbox",
    label: "工具箱",
    icon: Wrench,
    subItems: [
      {
        id: "quality",
        label: "质量检测",
        icon: CheckCircle,
      },
      {
        id: "daily-log",
        label: "每日日志",
        icon: BookOpen,
      },
      {
        id: "qa",
        label: "知识问答",
        icon: MessageCircleQuestion,
      },
    ],
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { currentProject, projects, setCurrentProject } = useProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "plan",
    "monitoring",
    "toolbox",
  ]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { logout, user } = useAuth();

  const handleNewProject = () => {
    navigate("/create-project");
  };

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      navigate(`/project/${projectId}`);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const toggleExpanded = (itemId: string) => {
    // 所有菜单项都支持展开/收起
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  type HoverEventLike = {
    currentTarget: {
      getBoundingClientRect: () => { top: number; right: number };
    };
  };

  const handleMouseEnter = (
    itemId: string,
    event: React.MouseEvent<HTMLElement> | HoverEventLike,
  ) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.top,
      left: rect.right + 8, // 8px gap
    });
    setHoveredItem(itemId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
      setMenuPosition(null);
    }, 150); // 150ms延迟，避免快速移动时闪烁
  };

  // 清理timeout
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      {isCollapsed && (
        <Button
          variant="outline"
          size="icon"
          className="fixed z-50 h-8 w-8 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
          style={{
            left: "4.5rem",
            top: "1.5rem",
            transform: "translate(-50%, 0)",
          }}
          onClick={toggleSidebar}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      <Sidebar className="border-r border-gray-200" collapsible="icon">
        <SidebarContent className="flex flex-col h-full">
          {/* 顶部公司Logo和名称 */}
          <SidebarHeader className="px-4 py-4 relative">
            <div className="flex items-center justify-between">
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center space-x-3 cursor-pointer transition-opacity hover:opacity-80"
                      onClick={handleLogoClick}
                    >
                      <img src="/logo.svg" alt="天友" className="h-8 w-8" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>A.PM 智慧建管</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div
                  className="flex items-center space-x-3 cursor-pointer transition-opacity hover:opacity-80"
                  onClick={handleLogoClick}
                >
                  <img src="/logo.svg" alt="天友" className="h-8 w-8" />
                  <h1 className="text-lg font-semibold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                    A.PM 智慧建管
                  </h1>
                </div>
              )}
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
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden py-1"
            style={
              isCollapsed
                ? { paddingLeft: "12px", paddingRight: "12px" }
                : { paddingLeft: "8px", paddingRight: "8px" }
            }
          >
            {/* 主导航菜单 - 移除SidebarGroupLabel */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.title}>
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-full h-8"
                              >
                                <NavLink to={item.url}>
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                </NavLink>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{item.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <SidebarMenuButton
                            asChild
                            isActive={location.pathname === item.url}
                          >
                            <NavLink to={item.url}>
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                                {item.title}
                              </span>
                            </NavLink>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* 分割线 */}
            <Separator className="mx-4 my-2" />

            {/* 项目选择器 */}
            {!isCollapsed && (
              <SidebarGroup className="py-0 my-0">
                <SidebarGroupContent>
                  <div className="bg-transparent">
                    <div className="flex items-center w-full">
                      <DropdownMenu
                        open={dropdownOpen}
                        onOpenChange={setDropdownOpen}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-9 p-2 font-normal bg-white border border-gray-200 flex items-center gap-2 rounded-md hover:bg-gray-50 hover:text-foreground active:bg-gray-100 transition-colors"
                          >
                            <span className="truncate text-left flex-1">
                              {currentProject?.name || "选择项目"}
                            </span>
                            {dropdownOpen ? (
                              <ChevronUp className="h-4 w-4 opacity-60 flex-shrink-0 ml-auto" />
                            ) : (
                              <ChevronDown className="h-4 w-4 opacity-60 flex-shrink-0 ml-auto" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] px-[4px] bg-card">
                          {projects.map((project) => (
                            <DropdownMenuItem
                              key={project.id}
                              onClick={() => handleProjectSelect(project.id)}
                              className={cn(
                                "cursor-pointer",
                                project.id === currentProject?.id &&
                                  "bg-accent",
                              )}
                            >
                              {project.name}
                              {project.id === currentProject?.id && (
                                <span className="ml-auto text-xs">✓</span>
                              )}
                            </DropdownMenuItem>
                          ))}
                          {projects.length === 0 && (
                            <DropdownMenuItem disabled>暂无项目</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleNewProject}
                            className="cursor-pointer"
                          >
                            新建项目
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* 项目相关菜单 - 移除SidebarGroupLabel */}
            {currentProject && (
              <SidebarGroup className="pt-4">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {projectMenuItems.map((item) => {
                      const Icon = item.icon;
                      const targetPath = `/project/${currentProject.id}/${item.id}`;
                      // 使用 pathname 判断是否激活，避免匹配 query params
                      // 对于带有子项的菜单，只要当前路径以该菜单路径开头就算激活
                      // 对于没有子项的菜单，使用精确匹配或前缀匹配（视情况而定）
                      const isActive =
                        location.pathname === targetPath ||
                        (location.pathname.startsWith(targetPath + "/") &&
                          location.pathname !== targetPath);
                      const isExpanded = expandedItems.includes(item.id);
                      const hasSubItems =
                        item.subItems && item.subItems.length > 0;

                      return (
                        <div key={item.id}>
                          <SidebarMenuItem>
                            {hasSubItems ? (
                              isCollapsed ? (
                                <div
                                  className="relative"
                                  onMouseEnter={(e) =>
                                    handleMouseEnter(item.id, e)
                                  }
                                  onMouseLeave={handleMouseLeave}
                                >
                                  <SidebarMenuButton className="w-full justify-center hover:bg-accent hover:text-accent-foreground">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                  </SidebarMenuButton>
                                </div>
                              ) : (
                                <SidebarMenuButton
                                  onClick={() => toggleExpanded(item.id)}
                                  className="w-full justify-between hover:bg-accent hover:text-accent-foreground"
                                >
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                                      {item.label}
                                    </span>
                                  </div>
                                  <ChevronRight
                                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                                      isExpanded ? "rotate-90" : ""
                                    }`}
                                  />
                                </SidebarMenuButton>
                              )
                            ) : isCollapsed ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-full h-8"
                                  >
                                    <NavLink
                                      to={`/project/${currentProject.id}/${item.id}`}
                                    >
                                      <Icon className="h-4 w-4 text-muted-foreground" />
                                    </NavLink>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>{item.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <SidebarMenuButton asChild isActive={isActive}>
                                <NavLink
                                  to={`/project/${currentProject.id}/${item.id}`}
                                >
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                                    {item.label}
                                  </span>
                                </NavLink>
                              </SidebarMenuButton>
                            )}
                          </SidebarMenuItem>

                          {/* 子菜单 - 只在展开状态下显示 */}
                          {hasSubItems && isExpanded && !isCollapsed && (
                            <div className="ml-4 space-y-1">
                              {item.subItems.map((subItem) => {
                                const SubIcon = subItem.icon;
                                // 检查当前路径是否匹配此子项
                                const expectedPath = `/project/${currentProject.id}/${item.id}/${subItem.id}`;
                                const isSubActive =
                                  location.pathname === expectedPath;
                                return (
                                  <SidebarMenuItem key={subItem.id}>
                                    <SidebarMenuButton
                                      asChild
                                      isActive={isSubActive}
                                    >
                                      <NavLink
                                        to={`/project/${currentProject.id}/${item.id}/${subItem.id}`}
                                      >
                                        <SubIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                                          {subItem.label}
                                        </span>
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </div>

          {/* 底部新建项目按钮 */}
          <div className="px-4 py-2">
            {isCollapsed ? (
              <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleNewProject}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>新建项目</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Button
                variant="default"
                className="w-full justify-center gap-2"
                onClick={handleNewProject}
              >
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
                        <Button
                          variant="ghost"
                          className="relative h-8 w-8 rounded-full"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userAvatar} alt="User" />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56"
                        align="end"
                        forceMount
                      >
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          {user?.username || "用户"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>设置</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          退出登录
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{user?.username || "用户"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-2"
                  >
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={userAvatar} alt="User" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {user?.username || "用户"}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    {user?.username || "用户"}
                  </DropdownMenuItem>
                  <DropdownMenuItem>设置</DropdownMenuItem>
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

      {/* Portal-rendered hover menu */}
      {hoveredItem &&
        menuPosition &&
        createPortal(
          <div
            style={{ top: menuPosition.top, left: menuPosition.left }}
            className="fixed z-[9999] w-48 bg-white border border-gray-200 rounded-md shadow-lg p-2"
            onMouseEnter={() =>
              handleMouseEnter(hoveredItem, {
                currentTarget: {
                  getBoundingClientRect: () => ({
                    top: menuPosition.top,
                    right: menuPosition.left,
                  }),
                },
              })
            }
            onMouseLeave={handleMouseLeave}
          >
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                {
                  projectMenuItems.find((item) => item.id === hoveredItem)
                    ?.label
                }
              </div>
              <div className="border-t pt-1">
                {projectMenuItems
                  .find((item) => item.id === hoveredItem)
                  ?.subItems?.map((subItem) => {
                    const SubIcon = subItem.icon;
                    return (
                      <Button
                        key={subItem.id}
                        variant="ghost"
                        className="w-full justify-start h-8 px-2 text-sm"
                        asChild
                      >
                        <NavLink
                          to={`/project/${
                            currentProject?.id || ""
                          }/${hoveredItem}/${subItem.id}`}
                        >
                          <SubIcon className="h-4 w-4 mr-2" />
                          {subItem.label}
                        </NavLink>
                      </Button>
                    );
                  })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </TooltipProvider>
  );
}
