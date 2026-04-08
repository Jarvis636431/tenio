import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface ProjectSliderProps {
  currentDay: number;
  startDay: number;
  endDay: number;
  playbackRate: 1 | 2 | 4;
  isPlaying: boolean;
  dateLabel: string;
  progress: number;
  onPreviousDay: () => void;
  onTogglePlay: () => void;
  onNextDay: () => void;
  onChangeRate: (rate: 1 | 2 | 4) => void;
  onChangeDay: (day: number) => void;
}

export function ProjectSlider({
  currentDay,
  startDay,
  endDay,
  playbackRate,
  isPlaying,
  dateLabel,
  progress,
  onPreviousDay,
  onTogglePlay,
  onNextDay,
  onChangeRate,
  onChangeDay,
}: ProjectSliderProps) {
  return (
    <div className="shrink-0 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-cyan-300/80 transition hover:text-cyan-100"
            onClick={onPreviousDay}
            aria-label="上一天"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-cyan-300 transition hover:text-cyan-100"
            onClick={onTogglePlay}
            aria-label={isPlaying ? "暂停播放" : "开始播放"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-cyan-300/80 transition hover:text-cyan-100"
            onClick={onNextDay}
            aria-label="下一天"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          {[1, 2, 4].map((rate) => (
            <button
              key={rate}
              type="button"
              className={`ml-1 inline-flex h-7 min-w-9 items-center justify-center rounded-md px-2 text-[11px] font-medium transition ${
                playbackRate === rate ? "text-cyan-100" : "text-cyan-300/70 hover:text-cyan-200"
              }`}
              onClick={() => onChangeRate(rate as 1 | 2 | 4)}
            >
              {rate}x
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-cyan-200">
          <span>{dateLabel || "--"}</span>
          <span className="text-cyan-300/70">{progress}%</span>
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <Slider
          value={[currentDay]}
          min={startDay}
          max={endDay}
          step={1}
          onValueChange={(v) => onChangeDay(v[0])}
          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-cyan-100 [&_[role=slider]]:bg-[#5dd6ff] [&_[role=slider]]:shadow-[0_0_0_3px_rgba(93,214,255,0.2)] [&>span:first-child]:h-[3px] [&>span:first-child]:bg-[#0a2a52] [&>span:first-child>span]:bg-[#5dd6ff]"
        />
      </div>
    </div>
  );
}
