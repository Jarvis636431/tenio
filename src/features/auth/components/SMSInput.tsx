import { Lock } from "lucide-react";
import { SMSButton } from "./SMSButton";

interface SMSInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSendCode: () => void | Promise<void>;
  cooldown: number;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

function SMSInput({
  label = "验证码",
  value,
  onChange,
  onSendCode,
  cooldown,
  disabled,
  placeholder = "请输入验证码",
  error,
}: SMSInputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="form-label">{label}</label>}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-apm-dim" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 pl-[38px] pr-4 text-sm text-white placeholder:text-apm-dim focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none"
          />
        </div>
        <SMSButton onClick={onSendCode} cooldown={cooldown} disabled={disabled} />
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}

export { SMSInput };
