import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app/AppSidebar";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/ai/components/ChatPanel";
import { useChatPanel } from "@/components/ai/hooks/useChatPanel";
import { ProjectBreadcrumb } from "@/components/layout/project/ProjectBreadcrumb";
interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const chatPanel = useChatPanel();

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar />
      
      <main className="flex-1 overflow-hidden px-3 py-3 bg-white">
        <ProjectBreadcrumb />
        {children}
      </main>

      {!chatPanel.isOpen && (
        <Button
          onClick={chatPanel.open}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
        >
          <Sparkles className="w-8 h-8" />
        </Button>
      )}

      <ChatPanel state={chatPanel} />
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
