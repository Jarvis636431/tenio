import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/date";

export function useTime() {
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
    return `${formatDate(now, "yyyy-mm-dd")}  ${weekday}`;
  }, [now]);

  return {
    now,
    timeText,
    dateText,
  };
}
