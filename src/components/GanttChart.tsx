import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
interface ScheduleItem {
  id: number;
  task: string;
  startDate: string;
  endDate: string;
  duration: string;
  worker: string;
  count: number;
}
interface GanttChartProps {
  data: ScheduleItem[];
}
const getWorkerColor = (worker: string): string => {
  const colors: {
    [key: string]: string;
  } = {
    "木工": "#3b82f6",
    "混凝土工": "#f97316",
    "砌筑工": "#10b981",
    "抹灰工": "#8b5cf6",
    "安装工": "#ec4899"
  };
  return colors[worker] || "#6b7280";
};
const parseDate = (dateStr: string): Date => {
  // 解析 "8月1日" 格式的日期
  const match = dateStr.match(/(\d+)月(\d+)日/);
  if (match) {
    const month = parseInt(match[1]) - 1; // JavaScript月份从0开始
    const day = parseInt(match[2]);
    return new Date(2024, month, day); // 假设是2024年
  }
  return new Date();
};
export function GanttChart({
  data
}: GanttChartProps) {
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
        duration: Math.max(duration, 1),
        color: getWorkerColor(item.worker)
      };
    });
    return {
      timelineData,
      totalDays,
      startDate: minDate
    };
  }, [data]);

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
  return <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">施工工序甘特图</h2>
        <p className="text-sm text-muted-foreground">
          基于总进度规划表生成的项目时间轴视图
        </p>
      </div>
      <div>
        <div className="flex flex-col border rounded-lg">
          {/* 表头区域 */}
          <div className="flex border-b">
            {/* 左侧固定任务名称标题 */}
            <div className="w-64 bg-muted/50 border-r p-3 font-semibold flex-shrink-0">
              任务名称
            </div>
            
            {/* 右侧可滚动时间轴标题 */}
            <div className="flex-1 overflow-x-auto">
              <div className="bg-muted/50" style={{ minWidth: `${totalDays * 80}px` }}>
                <div className="grid gap-0 h-12" style={{
                  gridTemplateColumns: `repeat(${totalDays}, 80px)`
                }}>
                  {dateHeaders.map(header => 
                    <div key={header.day} className={`border-r border-border/50 flex flex-col items-center justify-center text-xs p-1 ${header.dayOfWeek === 0 || header.dayOfWeek === 6 ? 'bg-muted/70 text-muted-foreground' : ''}`}>
                      <div className="font-medium">{header.date}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {['日', '一', '二', '三', '四', '五', '六'][header.dayOfWeek]}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="max-h-96 overflow-y-auto">
            {timelineData.map((item, index) => 
              <div key={item.id} className="flex border-b">
                {/* 左侧固定任务名称列 */}
                <div className="w-64 border-r p-3 flex flex-col justify-center flex-shrink-0 bg-background">
                  <div className="font-medium text-sm mb-1">{item.task}</div>
                  <div className="flex items-center gap-2">
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
                
                {/* 右侧可滚动甘特条区域 */}
                <div className="flex-1 overflow-x-auto">
                  <div className="relative" style={{ minWidth: `${totalDays * 80}px` }}>
                    <div className="grid gap-0 h-16" style={{
                      gridTemplateColumns: `repeat(${totalDays}, 80px)`
                    }}>
                      {/* 网格背景 */}
                      {dateHeaders.map(header => 
                        <div key={header.day} className={`border-r border-border/20 ${header.dayOfWeek === 0 || header.dayOfWeek === 6 ? 'bg-muted/30' : ''}`} />
                      )}
                      
                      {/* 任务条 */}
                      <div className="absolute top-2 h-12 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-sm animate-fade-in" style={{
                        left: `${(item.startDay * 80)}px`,
                        width: `${item.duration * 80}px`,
                        backgroundColor: item.color,
                        minWidth: '80px'
                      }}>
                        <div className="px-2 text-center">
                          <div className="font-medium">{item.duration}天</div>
                          <div className="text-xs opacity-90">
                            {item.startDate} - {item.endDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 图例 */}
        

        {/* 统计信息 */}
        
      </div>
    </div>;
}