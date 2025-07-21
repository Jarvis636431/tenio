
import { Calendar, BarChart3, Activity, TrendingUp, ChevronLeft, ChevronRight, Info, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [{
  id: "basic-info",
  label: "基础信息",
  icon: Info,
  description: "项目基本信息和文件管理"
}, {
  id: "plan-overview",
  label: "计划总览",
  icon: Calendar,
  description: "总进度规划表和施工工序甘特图"
}, {
  id: "real-time-monitoring",
  label: "实时监测",
  icon: Activity,
  description: "采购、劳动力、资金使用和物料供应"
}, {
  id: "order-management",
  label: "订单管理",
  icon: ShoppingCart,
  description: "采购订单和供应商管理"
}];

export function ProjectSidebar({
  activeView,
  onViewChange,
  isCollapsed,
  onToggleCollapse
}: ProjectSidebarProps) {
  // 完全收起时宽度为0，完全隐藏
  if (isCollapsed) {
    return null;
  }

  return (
    <div className="w-64 h-full bg-transparent transition-all duration-300 flex flex-col overflow-hidden border-r border-border/50">
      {/* Header - 按钮在标题左侧，更明显的布局 */}
      <div className="p-4 flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0 flex-shrink-0 hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-normal ml-1">办公楼建设项目</h2>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2">
        <ul className="space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button 
                  onClick={() => onViewChange(item.id)} 
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", 
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs opacity-70 text-left">{item.description}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
