
import { useState } from "react";
import { Calendar, BarChart3, Activity, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  {
    id: "plan-overview",
    label: "计划总览",
    icon: Calendar,
    description: "总进度规划表和施工工序甘特图"
  },
  {
    id: "real-time-monitoring",
    label: "实时监测",
    icon: Activity,
    description: "采购、劳动力、资金使用和物料供应"
  }
];

export function ProjectSidebar({ activeView, onViewChange }: ProjectSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "h-full bg-sidebar border-r border-border transition-all duration-300 flex flex-col overflow-hidden",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 bg-sidebar-accent/30 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="font-semibold text-lg">办公楼建设项目</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2">
        <ul className="space-y-2">
          {menuItems.map((item) => {
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
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs opacity-70 text-left">{item.description}</span>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
