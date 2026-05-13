import { useEffect, useState } from "react";

interface UseSmsCooldownOptions {
  initialCooldown?: number;
}

interface UseSmsCooldownReturn {
  cooldown: number;
  start: (seconds: number) => void;
  reset: () => void;
}

/**
 * 管理短信验证码倒计时状态。
 *
 * @param options.initialCooldown 初始倒计时秒数
 * @returns 倒计时状态和控制函数
 */
export function useSmsCooldown(options: UseSmsCooldownOptions = {}): UseSmsCooldownReturn {
  const { initialCooldown = 0 } = options;
  const [cooldown, setCooldown] = useState(initialCooldown);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const start = (seconds: number) => {
    setCooldown(seconds);
  };

  const reset = () => {
    setCooldown(0);
  };

  return { cooldown, start, reset };
}
