import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AIAssistant } from "@/components/AIAssistant";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { SidebarToggle } from "@/components/SidebarToggle";
import { useLocation } from "react-router-dom";
interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar />
      
      {/* 收起状态下显示border上的展开按钮 */}
      {isCollapsed && <SidebarToggle />}
      
      <main className="flex-1 overflow-hidden px-[16px] py-[16px] bg-white">
        {children}
      </main>
      
      <AIAssistant />
    </div>
  );
}

export function Layout({
  children
}: LayoutProps) {
  const location = useLocation();
  
  return <ProjectProvider>
      <SidebarProvider defaultOpen={true}>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </ProjectProvider>;
}