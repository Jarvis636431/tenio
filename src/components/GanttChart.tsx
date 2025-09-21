import { useMemo, useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";

interface ScheduleItem {
  id: number;
  task: string;
  startDate: string;
  endDate: string;
  duration: string;
  worker: string;
  count: number;
  floor?: number;
}

interface GanttChartProps {
  data: ScheduleItem[];
  onTaskDetail?: (task: ScheduleItem) => void;
}

const getWorkerColor = (worker: string): string => {
  const colors: {
    [key: string]: string;
  } = {
    "钢筋工": "#3b82f6",
    "混凝土工": "#f97316",
    "木工": "#10b981",
    "测量员": "#8b5cf6",
    "土方工": "#f59e0b",
    "砌筑工": "#10b981",
    "抹灰工": "#8b5cf6",
    "防水工": "#06b6d4",
    "水电工": "#14b8a6",
    "油漆工": "#84cc16",
    "油工": "#84cc16",
    "瓦工": "#ec4899",
    "不限": "#6b7280"
  };
  return colors[worker] || "#6b7280";
};

const parseDate = (dateStr: string): Date => {
  // 解析 "2025/09/01" 格式的日期
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JavaScript月份从0开始
      const day = parseInt(parts[2]);
      return new Date(year, month, day);
    }
  }
  
  // 兼容旧的 "8月1日" 格式
  const match = dateStr.match(/(\d+)月(\d+)日/);
  if (match) {
    const month = parseInt(match[1]) - 1; // JavaScript月份从0开始
    const day = parseInt(match[2]);
    return new Date(2024, month, day); // 假设是2024年
  }
  
  return new Date();
};

export function GanttChart({ data, onTaskDetail }: GanttChartProps) {
  const taskListRef = useRef<HTMLDivElement>(null);
  const chartContentRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [showDetailButton, setShowDetailButton] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    timelineData,
    totalDays,
    startDate
  } = useMemo(() => {
    const dates = data.flatMap(item => [parseDate(item.startDate), parseDate(item.endDate)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const timelineData = data.map(item => {
      const start = parseDate(item.startDate);
      const end = parseDate(item.endDate);
      const startDay = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return {
        ...item,
        startDay,
        duration: Math.max(duration, 1).toString(),
        color: getWorkerColor(item.worker)
      };
    });

    return {
      timelineData,
      totalDays,
      startDate: minDate
    };
  }, [data]);

  // 同步滚动逻辑 - 只监听右侧滚动，同步到左侧
  useEffect(() => {
    const taskList = taskListRef.current;
    const chartContent = chartContentRef.current;

    if (!taskList || !chartContent) return;

    const handleChartScroll = () => {
      if (isScrolling) return;
      setIsScrolling(true);
      taskList.scrollTop = chartContent.scrollTop;
      setTimeout(() => setIsScrolling(false), 10);
    };

    // 重置滚动位置
    taskList.scrollTop = 0;
    chartContent.scrollTop = 0;

    chartContent.addEventListener('scroll', handleChartScroll);

    return () => {
      chartContent.removeEventListener('scroll', handleChartScroll);
    };
  }, [data]); // 数据变化时重新建立同步并重置滚动位置

  // 生成日期标头
  const dateHeaders = Array.from({
    length: totalDays
  }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);
    return {
      day: index + 1,
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      dayOfWeek: date.getDay()
    };
  });

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="border rounded-lg overflow-hidden h-full flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧固定区域 */}
            <div className="w-80 flex-shrink-0 flex flex-col">
              {/* 任务名称表头 */}
              <div className="bg-muted/50 border-r border-b p-3 font-semibold h-12 flex items-center">
                任务名称
              </div>
              {/* 任务列表 */}
              <div ref={taskListRef} className="flex-1 overflow-hidden border-r bg-background">
                {timelineData.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="border-b p-2 flex items-center justify-between h-12 hover:bg-gray-50 transition-colors relative group"
                    onMouseEnter={() => {
                      setHoveredTaskId(item.id);
                      // 清除之前的定时器
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                      }
                      // 延迟显示详情按钮 - 减少延迟时间
                      hoverTimeoutRef.current = setTimeout(() => {
                        setShowDetailButton(item.id);
                      }, 150);
                    }}
                    onMouseLeave={() => {
                      setHoveredTaskId(null);
                      setShowDetailButton(null);
                      // 清除定时器
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                      }
                    }}
                    style={{ paddingLeft: '8px', paddingRight: '8px' }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate transition-all duration-200 ${
                        showDetailButton === item.id ? 'max-w-[120px]' : 'max-w-[200px]'
                      }`}>{item.task}</div>
                      <div className="w-px h-4 bg-border flex-shrink-0"></div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge style={{
                          backgroundColor: `${item.color}20`,
                          color: item.color,
                          borderColor: item.color
                        }} className="text-xs">
                          {item.worker}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.count}人
                        </span>
                      </div>
                    </div>
                    {/* 详情按钮 - 只在hover时显示，使用绝对定位避免影响布局 */}
                    {showDetailButton === item.id && onTaskDetail && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 px-2 opacity-100 transition-opacity duration-200 z-10 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => onTaskDetail(item)}
                      >
                        详情
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* 右侧整体滚动区域 */}
            <div ref={chartContentRef} className="flex-1 overflow-auto flex flex-col">
              <div style={{ minWidth: `${totalDays * 80}px` }} className="flex-1">
                {/* 时间轴表头 */}
                <div className="bg-muted/50 border-b sticky top-0 z-10">
                  <div className="grid gap-0 h-12" style={{
                    gridTemplateColumns: `repeat(${totalDays}, 80px)`
                  }}>
                    {dateHeaders.map(header => (
                      <div key={header.day} className={`border-r border-border/50 flex flex-col items-center justify-center text-xs p-1 ${header.dayOfWeek === 0 || header.dayOfWeek === 6 ? 'bg-muted/70 text-muted-foreground' : ''}`}>
                        <div className="font-medium">{header.date}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {['日', '一', '二', '三', '四', '五', '六'][header.dayOfWeek]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 甘特图内容 */}
                <div className="flex-1">
                  {timelineData.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="border-b relative h-12 hover:bg-gray-50 transition-colors"
                      onMouseEnter={() => setHoveredTaskId(item.id)}
                      onMouseLeave={() => setHoveredTaskId(null)}
                    >
                      <div className="grid gap-0 h-full" style={{
                        gridTemplateColumns: `repeat(${totalDays}, 80px)`
                      }}>
                        {/* 网格背景 */}
                        {dateHeaders.map(header => (
                          <div key={header.day} className={`border-r border-border/20 ${header.dayOfWeek === 0 || header.dayOfWeek === 6 ? 'bg-muted/30' : ''}`} />
                        ))}
                        
                        {/* 任务条 - 可点击 */}
                        <div 
                          className="absolute top-1 h-10 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-sm animate-fade-in cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 hover:brightness-110" 
                          style={{
                            left: `${(item.startDay * 80)}px`,
                            width: `${Number(item.duration) * 80}px`,
                            backgroundColor: item.color,
                            minWidth: '80px'
                          }}
                          onClick={() => onTaskDetail?.(item)}
                        >
                          <div className="px-2 text-center">
                            <div className="font-medium">{item.duration}天</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
