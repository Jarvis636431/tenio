import { useEffect, useMemo, useState } from "react";

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
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}  ${weekday}`;
  }, [now]);

  return {
    now,
    timeText,
    dateText,
  };
}
