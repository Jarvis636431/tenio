import { Link } from "react-router-dom";
import { Radar } from "lucide-react";

const NotFound = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--apm-bg))]">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-apm-grid opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-apm-ambient" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-apm bg-apm-card shadow-apm-glow">
          <Radar className="h-10 w-10 text-cyan-300" />
        </div>

        <h1 className="font-display text-6xl font-semibold tracking-tight text-white">404</h1>
        <p className="mt-2 text-lg text-apm-muted">抱歉，当前页面不存在或正在建设中</p>

        <div className="mt-8 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-sm border border-cyan-400/20 bg-transparent px-5 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-400/10"
          >
            返回首页
          </Link>
          <Link
            to="/projects"
            className="inline-flex h-10 items-center justify-center rounded-sm border border-cyan-400/20 bg-[linear-gradient(135deg,hsl(var(--apm-accent)),hsl(var(--apm-accent-strong)))] px-5 text-sm font-medium text-[#020c1b] transition hover:opacity-90"
          >
            进入项目控制台
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
