import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app/AppSidebar";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { ProjectBreadcrumb } from "@/components/layout/project/ProjectBreadcrumb";
interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar />
      
      <main className="flex-1 overflow-hidden px-3 py-3 bg-white">
        <ProjectBreadcrumb />
        {children}
      </main>
      
      <AIAssistant />
    </div>
  );
}

export function AppLayout({
  children
}: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
