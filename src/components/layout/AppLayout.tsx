import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { Chat, useChat } from "@/features/ai";
import { useProject } from "@/features/project";

interface LayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const chatState = useChat();
  const { currentProject } = useProject();

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[hsl(var(--apm-bg))] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-apm-grid opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-apm-ambient" />
      <AppHeader variant="project" projectName={currentProject?.project_name} showUser />

      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)]">
        <div className="min-h-0 border-r border-apm bg-[hsl(var(--apm-bg-overlay))/0.72] backdrop-blur-sm">
          <Chat state={chatState} className="h-full" />
        </div>

        <main className="min-h-0 overflow-hidden">
          <div className="h-full overflow-x-hidden overflow-y-auto overscroll-none">{children}</div>
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
