import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app/AppSidebar";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { ChatButton } from "@/components/ai/ChatButton";
import { useChatPanel } from "@/components/ai/hooks/useChatPanel";
interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const chatPanel = useChatPanel();

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar />
      
      <main className="flex-1 overflow-hidden px-3 py-3 bg-white">
        {children}
      </main>

      {!chatPanel.isOpen && (
        <ChatButton
          className="fixed bottom-6 right-6 z-50"
          size="md"
        />
      )}

      <ChatPanel
        state={chatPanel}
        position={{ bottom: 24, right: 24 }}
      />
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
