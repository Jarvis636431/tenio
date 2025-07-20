
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({
  children
}: LayoutProps) {
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="fixed left-0 top-0 h-full z-30">
          <AppSidebar />
        </div>
        <main className="flex-1 ml-16 overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>;
}
