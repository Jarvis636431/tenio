
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute z-10 h-8 w-8 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
      style={{
        left: "4.5rem", // 收起状态下侧边栏宽度 + 按钮宽度的一半
        top: "1.5rem", // 调整垂直位置，与侧边栏头部对齐
        transform: "translate(-50%, 0)",
      }}
      onClick={toggleSidebar}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}
