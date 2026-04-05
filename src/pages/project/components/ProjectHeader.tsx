import type { ReactNode } from "react";
import { CalendarDays, Clock3, CloudRain, Thermometer, Users } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import { useTime } from "@/hooks/useTime";

interface ProjectHeaderProps {
  title?: string;
  actions?: ReactNode;
  className?: string;
  titleExtra?: ReactNode;
  onsiteCount?: number;
}

export function ProjectHeader({
  title,
  actions,
  className = "",
  titleExtra,
  onsiteCount,
}: ProjectHeaderProps) {
  const liveWeather = useWeather();
  const { dateText, timeText } = useTime();

  return (
    <div className={`flex h-9 items-center justify-between rounded-md text-[#d8ebff] ${className}`}>
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
          {liveWeather.temperatureText}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[#9cc7ff]">
          <CloudRain className="h-3 w-3" />
          {liveWeather.weatherText}
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
            {titleExtra && <span className="truncate text-[#9cc7ff]">{titleExtra}</span>}
          </>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
