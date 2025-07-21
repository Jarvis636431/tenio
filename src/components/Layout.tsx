
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AIAssistant } from "@/components/AIAssistant";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({
  children
}: LayoutProps) {
  return <SidebarProvider defaultOpen={false}>
      <div className="h-screen flex w-full bg-background overflow-hidden relative">
        {/* Hover trigger area - invisible strip on the left */}
        <div className="group fixed left-0 top-0 h-full w-2 z-50 hover:w-64 transition-all duration-300">
          <div className="absolute left-0 top-0 h-full w-2 bg-transparent" />
          <div className="absolute left-0 top-0 h-full w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
            <AppSidebar />
          </div>
        </div>
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
        <AIAssistant />
      </div>
    </SidebarProvider>;
}
