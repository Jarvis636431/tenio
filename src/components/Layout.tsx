
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AIAssistant } from "@/components/AIAssistant";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { Header } from "@/components/Header";
import { SidebarToggle } from "@/components/SidebarToggle";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({
  children
}: LayoutProps) {
  return (
    <ProjectProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="h-screen flex flex-col w-full bg-background overflow-hidden">
          {/* 全局 Header */}
          <Header />
          
          {/* 下方区域: Sidebar + Main Content */}
          <div className="flex-1 flex overflow-hidden relative">
            <AppSidebar />
            
            {/* 侧边栏分割线上的展开收起按钮 */}
            <SidebarToggle />
            
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
            
            <AIAssistant />
          </div>
        </div>
      </SidebarProvider>
    </ProjectProvider>
  );
}
