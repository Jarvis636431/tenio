import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { openChatPanel } from "@/components/ai/hooks/useChatPanel";

interface ChatButtonProps {
  className?: string;
  size?: "md" | "lg";
}

export function ChatButton({
  className,
  size = "md",
}: ChatButtonProps) {
  return (
    <Button
      type="button"
      onClick={openChatPanel}
      className={cn(
        "rounded-full bg-[#1975D2] text-white shadow-lg shadow-blue-200 hover:bg-[#1564b3] hover:scale-105 transition-all",
        size === "lg" ? "w-16 h-16 text-xs" : "w-14 h-14 text-xs",
        className,
      )}
    >
      <Sparkles className={size === "lg" ? "w-6 h-6" : "w-5 h-5"} />
    </Button>
  );
}
