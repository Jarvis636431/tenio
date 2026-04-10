import { AppTopbar } from "@/components/layout/AppTopbar";
import { Chat, useChat } from "@/features/ai";

interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const chatState = useChat();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#020c1b] text-slate-100">
      <AppTopbar />

      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)]">
        <Chat state={chatState} />
        <main className="min-h-0 overflow-x-hidden overflow-y-auto px-5 py-4">{children}</main>
      </div>
    </div>
  );
}

export function AppLayout({ children }: LayoutProps) {
  return <LayoutContent>{children}</LayoutContent>;
}
