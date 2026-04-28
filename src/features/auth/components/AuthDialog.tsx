import { type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-cyan-100/80">{label}</label>
      {children}
    </div>
  );
}

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit?: (e: FormEvent) => void | Promise<void>;
  submitText?: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  children: ReactNode;
  hideCloseButton?: boolean;
  className?: string;
}

function AuthDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitText = "确认",
  submitDisabled,
  isSubmitting,
  error,
  children,
  hideCloseButton,
  className,
}: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-md rounded-xl border border-cyan-400/20 bg-[rgba(4,18,37,0.94)] text-white shadow-apm-panel backdrop-blur-xl",
          className,
        )}
      >
        {!hideCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-md p-1 text-apm-dim transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-white">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-apm-muted">{description}</DialogDescription>
          )}
        </DialogHeader>
        <form
          onSubmit={
            onSubmit
              ? (e) => {
                  e.preventDefault();
                  void onSubmit(e);
                }
              : undefined
          }
          className="space-y-4"
        >
          {children}
          {error && (
            <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
              {error}
            </p>
          )}
          {onSubmit && (
            <Button
              type="submit"
              disabled={submitDisabled || isSubmitting}
              className="h-11 w-full rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              {isSubmitting ? "处理中..." : submitText}
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { AuthDialog, FormField };
