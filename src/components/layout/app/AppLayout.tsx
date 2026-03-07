import { AppSidebar } from "@/components/layout/app/AppSidebar";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { useChatPanel } from "@/components/ai/hooks/useChatPanel";
interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const chatPanel = useChatPanel();

  return (
    <div
      className="h-screen w-full overflow-hidden bg-background grid"
      style={{ gridTemplateColumns: "1fr 3fr 6fr" }}
    >
      <AppSidebar />

      <div className="relative border-r border-gray-200 bg-white/80">
        <ChatPanel
          state={chatPanel}
          positionType="absolute"
          position={{ top: 12, left: 12 }}
          width="calc(100% - 24px)"
          height="calc(100% - 24px)"
        />
      </div>

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
