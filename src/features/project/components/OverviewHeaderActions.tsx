import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OverviewHeaderActionsProps {
  onResetProject: () => void;
  onExportWeekly: () => void;
  onExportDaily: () => void;
}

export function OverviewHeaderActions({
  onResetProject,
  onExportWeekly,
  onExportDaily,
}: OverviewHeaderActionsProps) {
  const actionButtonClassName =
    "h-9 rounded-none border border-cyan-400/20 bg-[rgba(4,18,37,0.86)] px-3 text-cyan-100 transition hover:border-cyan-300/35 hover:bg-[rgba(8,34,67,0.92)]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" className={actionButtonClassName} onClick={onResetProject}>
        <RotateCcw className="mr-1.5 h-4 w-4" />
        重置项目
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" className={actionButtonClassName}>
            <Download className="mr-1.5 h-4 w-4" />
            报告导出
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-none border-cyan-500/20 bg-[#03112a] text-cyan-100"
        >
          <DropdownMenuItem
            className="rounded-none focus:bg-[#0a2a5c] focus:text-cyan-100"
            onSelect={(e) => {
              e.preventDefault();
              onExportWeekly();
            }}
          >
            导出周报
          </DropdownMenuItem>
          <DropdownMenuItem
            className="rounded-none focus:bg-[#0a2a5c] focus:text-cyan-100"
            onSelect={(e) => {
              e.preventDefault();
              onExportDaily();
            }}
          >
            导出日报
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
