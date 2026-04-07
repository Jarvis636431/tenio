import {
  Check,
  ChartLine,
  Download,
  ListTodo,
  Network,
  SlidersHorizontal,
  Users,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PanelVisibility = {
  headcount: boolean;
  cost: boolean;
  gantt: boolean;
  network: boolean;
};

interface OverviewHeaderActionsProps {
  panelVisibility: PanelVisibility;
  visiblePanelCount: number;
  onResetProject: () => void;
  onTogglePanel: (panel: keyof PanelVisibility) => void;
  onExportWeekly: () => void;
  onExportDaily: () => void;
}

export function OverviewHeaderActions({
  panelVisibility,
  visiblePanelCount,
  onResetProject,
  onTogglePanel,
  onExportWeekly,
  onExportDaily,
}: OverviewHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        className="h-8 border border-[#2f5e94] bg-[#0a2f5f] px-2 text-[#cfe6ff] hover:bg-[#12417c]"
        onClick={onResetProject}
      >
        <RotateCcw className="mr-1.5 h-4 w-4" />
        重置项目
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            className="h-8 border border-[#2f5e94] bg-[#0a2f5f] px-2 text-[#cfe6ff] hover:bg-[#12417c]"
          >
            <SlidersHorizontal className="mr-1.5 h-4 w-4" />
            视图 {visiblePanelCount}/4
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 border-cyan-900/60 bg-[#03112a] text-cyan-100"
        >
          <DropdownMenuLabel className="text-cyan-200">显示面板</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-cyan-900/60" />
          <DropdownMenuItem
            className="focus:bg-[#0a2a5c] focus:text-cyan-100"
            onSelect={(e) => {
              e.preventDefault();
              onTogglePanel("headcount");
            }}
          >
            <Users className="mr-2 h-4 w-4 text-cyan-300" />
            <span className="flex-1">劳动力曲线</span>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
              {panelVisibility.headcount && <Check className="h-3 w-3 text-cyan-200" />}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="focus:bg-[#0a2a5c] focus:text-cyan-100"
            onSelect={(e) => {
              e.preventDefault();
              onTogglePanel("cost");
            }}
          >
            <ChartLine className="mr-2 h-4 w-4 text-emerald-300" />
            <span className="flex-1">资金曲线</span>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
              {panelVisibility.cost && <Check className="h-3 w-3 text-cyan-200" />}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="focus:bg-[#0a2a5c] focus:text-cyan-100"
            onSelect={(e) => {
              e.preventDefault();
              onTogglePanel("gantt");
            }}
          >
            <ListTodo className="mr-2 h-4 w-4 text-amber-300" />
            <span className="flex-1">甘特图</span>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
              {panelVisibility.gantt && <Check className="h-3 w-3 text-cyan-200" />}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="focus:bg-[#0a2a5c] focus:text-cyan-100"
            onSelect={(e) => {
              e.preventDefault();
              onTogglePanel("network");
            }}
          >
            <Network className="mr-2 h-4 w-4 text-violet-300" />
            <span className="flex-1">网络图</span>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
              {panelVisibility.network && <Check className="h-3 w-3 text-cyan-200" />}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            className="h-8 border border-[#2f5e94] bg-[#0a2f5f] px-3 text-[#cfe6ff] hover:bg-[#12417c]"
          >
            <Download className="mr-1.5 h-4 w-4" />
            报告导出
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[var(--radix-dropdown-menu-trigger-width)] border-cyan-900/60 bg-[#03112a] text-cyan-100"
        >
          <DropdownMenuItem
            className="focus:bg-[#0a2a5c] focus:text-cyan-100"
            onSelect={(e) => {
              e.preventDefault();
              onExportWeekly();
            }}
          >
            导出周报
          </DropdownMenuItem>
          <DropdownMenuItem
            className="focus:bg-[#0a2a5c] focus:text-cyan-100"
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
