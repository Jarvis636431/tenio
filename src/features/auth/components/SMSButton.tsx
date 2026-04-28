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
        "shrink-0 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4",
        "text-[12px] font-semibold text-cyan-400 transition-colors",
        "hover:bg-cyan-400/20",
        "disabled:opacity-60 disabled:cursor-not-allowed",
      )}
    >
      {cooldown > 0 ? `${cooldown}s` : "获取验证码"}
    </button>
  );
}

export { SMSButton };
