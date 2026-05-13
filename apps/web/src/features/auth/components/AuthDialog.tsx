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
    <div className="space-y-1.5">
      <label className="form-label">{label}</label>
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
        hideCloseButton={hideCloseButton}
        className={cn(
          "max-h-[min(760px,calc(100vh-32px))] max-w-[520px] gap-0 overflow-hidden rounded-lg border border-cyan-400/25 bg-[rgba(4,18,37,0.96)] p-0 text-white shadow-apm-panel backdrop-blur-xl",
          className,
        )}
      >
        <div className="h-[2px] bg-gradient-to-r from-cyan-400 via-cyan-400/35 to-transparent" />
        <DialogHeader className="px-6 pb-3 pt-6 text-left sm:px-7">
          <DialogTitle className="font-display text-[24px] font-bold leading-tight text-white">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="max-w-[420px] pt-1 text-[13px] leading-6 text-apm-muted">
              {description}
            </DialogDescription>
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
          className="max-h-[calc(100vh-170px)] space-y-4 overflow-y-auto px-6 pb-6 pt-1 sm:px-7"
        >
          {children}
          {error && (
            <p className="rounded-md border border-red-400/20 bg-red-500/10 px-3.5 py-2 text-[13px] text-red-200">
              {error}
            </p>
          )}
          {onSubmit && (
            <Button
              type="submit"
              disabled={submitDisabled || isSubmitting}
              className="h-11 w-full rounded-md bg-cyan-400 text-[15px] font-bold text-slate-950 hover:bg-cyan-300"
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
