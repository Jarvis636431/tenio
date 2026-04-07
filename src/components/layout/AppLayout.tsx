import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";

interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#020c1b] text-slate-100">
      <AppTopbar />

      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)]">
        <AppSidebar />
        <main className="min-h-0 overflow-hidden px-5 py-4">{children}</main>
      </div>
    </div>
  );
}

export function AppLayout({ children }: LayoutProps) {
  return <LayoutContent>{children}</LayoutContent>;
}
