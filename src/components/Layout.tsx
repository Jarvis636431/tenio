
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AIAssistant } from "@/components/AIAssistant";
import { ProjectProvider } from "@/contexts/ProjectContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({
  children
}: LayoutProps) {
  return (
    <ProjectProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="h-screen flex w-full bg-background overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
          <AIAssistant />
        </div>
      </SidebarProvider>
    </ProjectProvider>
  );
}
