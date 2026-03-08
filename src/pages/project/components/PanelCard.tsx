import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PanelCardProps {
  title: string;
  icon: ReactNode;
  titleClassName?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function PanelCard({
  title,
  icon,
  titleClassName,
  className,
  headerClassName,
  contentClassName,
  children,
}: PanelCardProps) {
  return (
    <Card
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-cyan-900/40 bg-[#071a39]/75",
        className,
      )}
    >
      <CardHeader
        className={cn("p-2 pb-1 border-b border-cyan-900/50 bg-[#04142d]/80", headerClassName)}
      >
        <CardTitle className={cn("text-xs font-medium flex items-center gap-1.5", titleClassName)}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("flex-1 min-h-0 p-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
