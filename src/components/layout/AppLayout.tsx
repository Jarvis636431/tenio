import { AppSidebar } from "@/components/layout/AppSidebar";
import { Chat } from "@/components/ai/Chat";
import { useChatPanel } from "@/components/ai/hooks/useChatPanel";
interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const chatPanel = useChatPanel();

  return (
    <div className="grid h-screen w-full grid-cols-[56px_minmax(0,3fr)_minmax(0,6fr)] overflow-hidden bg-background">
      <AppSidebar />

      <Chat state={chatPanel} />

      <main className="flex-1 overflow-hidden px-3 py-3 bg-white">
        {children}
      </main>
    </div>
  );
}

export function AppLayout({
  children
}: LayoutProps) {
  return <LayoutContent>{children}</LayoutContent>;
}
