import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { SidebarToggle } from "@/components/layout/SidebarToggle";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
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
      
      <main className="flex-1 overflow-hidden px-3 py-3 bg-white">
        <PageBreadcrumb />
        {children}
      </main>
      
      <AIAssistant />
    </div>
  );
}

export function Layout({
  children
}: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}