import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Clock3,
  CloudRain,
  Download,
  Thermometer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectHeaderProps {
  title?: string;
  actions?: ReactNode;
  className?: string;
  titleExtra?: ReactNode;
  weatherText?: string;
  temperatureText?: string;
  onsiteCount?: number;
  onExportReport?: () => void;
}

export function ProjectHeader({
  title,
  actions,
  className = "",
  titleExtra,
  weatherText = "天气 --",
  temperatureText = "--°C",
  onsiteCount,
  onExportReport,
}: ProjectHeaderProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeText = useMemo(
    () =>
      now.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [now],
  );

  const dateText = useMemo(() => {
    const weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][
      now.getDay()
    ];
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}  ${weekday}`;
  }, [now]);

  return (
    <div
      className={`flex h-9 items-center justify-between rounded-md text-[#d8ebff] ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 text-[#9cc7ff]">
          <CalendarDays className="h-3 w-3" />
          {dateText}
        </span>
        <span className="text-[#1c4d86]/80">|</span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#66c9ff]">
          <Clock3 className="h-3 w-3" />
          {timeText}
        </span>
        <span className="text-[#1c4d86]/80">|</span>
        <span className="inline-flex items-center gap-1.5 text-[#ff9f43]">
          <Thermometer className="h-3 w-3" />
          {temperatureText}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[#9cc7ff]">
          <CloudRain className="h-3 w-3" />
          {weatherText}
        </span>
        {typeof onsiteCount === "number" && (
          <span className="inline-flex items-center gap-1.5 font-medium text-[#32d296]">
            <Users className="h-3 w-3" />
            {onsiteCount} 人在场
          </span>
        )}
        {title && (
          <>
            <span className="text-[#1c4d86]/80">|</span>
            <span className="truncate text-[#d8ebff]">{title}</span>
            {titleExtra && (
              <span className="truncate text-[#9cc7ff]">{titleExtra}</span>
            )}
          </>
        )}
      </div>

      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onExportReport}
            className="h-8 border border-[#2f5e94] bg-[#0a2f5f] px-3 text-[#cfe6ff] hover:bg-[#12417c]"
            disabled={!onExportReport}
          >
            <Download className="mr-1.5 h-4 w-4" />
            报告导出
          </Button>
        </div>
      )}
    </div>
  );
}
