import { AppSidebar } from "@/components/layout/AppSidebar";
import { Chat } from "@/components/ai/Chat";
import { useChatPanel } from "@/components/ai/hooks/useChatPanel";
interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const chatPanel = useChatPanel();

  return (
    <div className="grid h-screen w-full grid-cols-[56px_minmax(0,2fr)_minmax(0,7fr)] overflow-hidden bg-gradient-to-b from-[#020a1d] to-[#041332]">
      <AppSidebar />

      <Chat state={chatPanel} />

      <main className="flex-1 overflow-hidden bg-transparent px-3 pt-2 pb-3">{children}</main>
    </div>
  );
}

export function AppLayout({ children }: LayoutProps) {
  return <LayoutContent>{children}</LayoutContent>;
}
