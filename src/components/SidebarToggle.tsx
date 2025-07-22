
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background border-border shadow-md hover:shadow-lg transition-all duration-200"
      style={{
        left: isCollapsed ? "3rem" : "16rem",
        transform: "translate(-50%, -50%)",
      }}
      onClick={toggleSidebar}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </Button>
  );
}
