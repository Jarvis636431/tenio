import type { ReactNode } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { Chat, useChat } from "@/features/ai";

interface LayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const chatState = useChat();

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[hsl(var(--apm-bg))] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-apm-grid opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-apm-ambient" />
      <AppTopbar />

      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)]">
        <div className="min-h-0 border-r border-apm bg-[hsl(var(--apm-bg-overlay))/0.72] backdrop-blur-sm">
          <Chat state={chatState} className="h-full" />
        </div>

        <main className="min-h-0 overflow-hidden">
          <div className="h-full overflow-x-hidden overflow-y-auto px-5 py-5">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AppLayout({ children }: LayoutProps) {
  return (
    <ErrorBoundary>
      <LayoutContent>{children}</LayoutContent>
    </ErrorBoundary>
  );
}
