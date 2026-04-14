import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTime } from "@/hooks/useTime";

interface AppHeaderProps {
  /** 标题模式 */
  variant?: "project" | "console" | "upload";
  /** 项目名称（project 模式必需） */
  projectName?: string;
  /** 自定义标题文本 */
  title?: string;
  /** 是否显示通知按钮 */
  showNotifications?: boolean;
  /** 是否显示设置按钮 */
  showSettings?: boolean;
  /** 是否显示用户信息 */
  showUser?: boolean;
  /** 用户名 */
  userName?: string;
  /** 用户角色 */
  userRole?: string;
  /** Logo 图片地址 */
  logoSrc?: string;
  /** Logo alt 文本 */
  logoAlt?: string;
  /** 是否显示返回按钮（upload 模式） */
  showBackButton?: boolean;
  /** 返回按钮点击处理 */
  onBack?: () => void;
  /** 额外的 header class */
  className?: string;
}

/**
 * 应用统一顶部栏组件
 * 支持 project 模式（AppLayout）、console 模式（ProjectsPage）和 upload 模式（UploadPage）
 */
export function AppHeader({
  variant = "project",
  projectName,
  title,
  showNotifications = false,
  showSettings = false,
  showUser = false,
  userName = "张伟",
  userRole = "项目总监",
  logoSrc,
  logoAlt = "A.PM",
  showBackButton = false,
  onBack,
  className,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const { dateText, timeText } = useTime();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const defaultLogoSrc =
    variant === "console" || variant === "upload"
      ? "https://d2xsxph8kpxj0f.cloudfront.net/310519663381579886/3dGQrYeue3pTedcrRzk4ny/logo_icon_blue_cc74c57f.png"
      : "/logo.svg";

  const resolvedLogoSrc = logoSrc || defaultLogoSrc;
  const resolvedTitle =
    title || (variant === "console" ? "项目控制台" : variant === "upload" ? "新建项目" : null);

  const handleBack = onBack || (() => navigate("/projects"));

  const heightClass = variant === "project" ? "h-14" : "h-12";

  return (
    <header
      className={cn(
        "relative z-20 flex shrink-0 items-center gap-3 border-b border-cyan-500/15 bg-[rgba(2,12,27,0.94)] px-6 backdrop-blur-xl",
        heightClass,
        className,
      )}
    >
      {/* Logo + Brand */}
      <div className="flex items-center gap-2.5">
        <img src={resolvedLogoSrc} alt={logoAlt} className="h-6 w-6 object-contain" />
        <span className="font-display text-[15px] font-bold tracking-[-0.02em] text-white">
          A.<span className="text-cyan-400">PM</span>
          {(variant === "console" || variant === "upload") && " 智管"}
        </span>
      </div>

      {/* Separator + Title (console/upload mode) */}
      {(variant === "console" || variant === "upload") && (
        <>
          <span className="text-slate-500">|</span>
          <span className="text-sm text-slate-400">{resolvedTitle}</span>
        </>
      )}

      {/* Project name (project mode) */}
      {variant === "project" && projectName && (
        <>
          <div className="h-[18px] w-px bg-cyan-400/20" />
          <span className="truncate text-xs text-cyan-50">{projectName}</span>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Date/Time (project mode) */}
      {variant === "project" && (
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400">{dateText}</span>
          <span className="font-semibold text-cyan-300">{timeText}</span>
        </div>
      )}

      {/* Back button (upload mode) */}
      {showBackButton && (
        <button
          onClick={handleBack}
          className="rounded-md border border-slate-600 bg-transparent px-4 py-1.5 text-sm text-slate-400 transition-all hover:border-cyan-400/60 hover:text-cyan-300"
        >
          <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" />
          返回控制台
        </button>
      )}

      {/* Notifications (console mode) */}
      {showNotifications && (
        <button className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs text-apm-muted transition-colors hover:border-cyan-400 hover:text-cyan-400">
          <Bell className="h-3.5 w-3.5" />
          通知
          <span className="ml-1 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
            3
          </span>
        </button>
      )}

      {/* Settings (console mode) */}
      {showSettings && (
        <button className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs text-apm-muted transition-colors hover:border-cyan-400 hover:text-cyan-400">
          <Settings className="h-3.5 w-3.5" />
          设置
        </button>
      )}

      {/* User (console mode) */}
      {showUser && (
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-sky-500 text-[13px] font-bold text-white">
              {userName.charAt(0)}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-semibold text-white">{userName}</span>
              <span className="text-[10px] text-apm-muted">{userRole}</span>
            </div>
          </button>
          {showUserDropdown && (
            <div className="absolute right-0 top-full mt-2 min-w-[140px] rounded-lg border border-cyan-400/20 bg-[var(--bg-panel)]">
              <button className="flex w-full items-center gap-2 border-b border-cyan-400/20 px-4 py-2.5 text-xs text-apm-muted hover:text-white">
                账号设置
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:text-red-300"
              >
                退出登录
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
