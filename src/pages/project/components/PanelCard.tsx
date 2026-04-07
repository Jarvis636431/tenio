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
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-none border-cyan-400/15 bg-[rgba(4,18,37,0.82)] shadow-[0_0_0_1px_rgba(10,35,64,0.15)]",
        className,
      )}
    >
      <CardHeader
        className={cn(
          "border-b border-cyan-400/12 bg-[rgba(2,12,27,0.74)] px-3 py-2",
          headerClassName,
        )}
      >
        <CardTitle
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
            titleClassName,
          )}
        >
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("flex-1 min-h-0 p-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
