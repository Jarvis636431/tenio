import { cn } from "@/lib/utils";

interface SMSButtonProps {
  onClick: () => void | Promise<void>;
  cooldown: number;
  disabled?: boolean;
}

function SMSButton({ onClick, cooldown, disabled }: SMSButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={cooldown > 0 || disabled}
      className={cn(
        "h-10 shrink-0 rounded-md border border-cyan-400/25 bg-cyan-400/10 px-3",
        "text-[12px] font-bold text-cyan-300 transition-colors",
        "hover:border-cyan-400/50 hover:bg-cyan-400/20 hover:text-cyan-100",
        "disabled:opacity-60 disabled:cursor-not-allowed",
      )}
    >
      {cooldown > 0 ? `${cooldown}s` : "获取验证码"}
    </button>
  );
}

export { SMSButton };
