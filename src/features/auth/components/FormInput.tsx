import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="form-label">{label}</label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-apm-dim">{icon}</div>
          )}
          <input
            ref={ref}
            className={cn(
              "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5",
              icon ? "pl-[38px] pr-4" : "px-4",
              "text-sm text-white placeholder:text-apm-dim",
              "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
              error && "border-red-400/50",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";

export { FormInput };
