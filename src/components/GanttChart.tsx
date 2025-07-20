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
  const colors: { [key: string]: string } = {
    "木工": "#3b82f6",
    "混凝土工": "#f97316", 
    "砌筑工": "#10b981",
    "抹灰工": "#8b5cf6",
    "安装工": "#ec4899",
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

export function GanttChart({ data }: GanttChartProps) {
  const { timelineData, totalDays, startDate } = useMemo(() => {
    const dates = data.flatMap(item => [
      parseDate(item.startDate),
      parseDate(item.endDate)
    ]);
    
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

    return { timelineData, totalDays, startDate: minDate };
  }, [data]);

  // 生成日期标头
  const dateHeaders = Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);
    return {
      day: index + 1,
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      dayOfWeek: date.getDay()
    };
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>施工工序甘特图</CardTitle>
        <CardDescription>
          基于总进度规划表生成的项目时间轴视图
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 图例 */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-3">工种图例</h4>
          <div className="flex flex-wrap gap-3">
            {Object.entries({
              "木工": "#3b82f6",
              "混凝土工": "#f97316", 
              "砌筑工": "#10b981",
              "抹灰工": "#8b5cf6",
              "安装工": "#ec4899",
            }).map(([worker, color]) => (
              <div key={worker} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm">{worker}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <div className="text-lg font-bold text-primary">{totalDays}</div>
            <div className="text-xs text-muted-foreground">总工期（天）</div>
          </div>
          <div className="text-center p-3 bg-success/5 rounded-lg">
            <div className="text-lg font-bold text-success">{data.length}</div>
            <div className="text-xs text-muted-foreground">施工任务</div>
          </div>
          <div className="text-center p-3 bg-warning/5 rounded-lg">
            <div className="text-lg font-bold text-warning">
              {new Set(data.map(item => item.worker)).size}
            </div>
            <div className="text-xs text-muted-foreground">工种类型</div>
          </div>
          <div className="text-center p-3 bg-destructive/5 rounded-lg">
            <div className="text-lg font-bold text-destructive">
              {data.reduce((sum, item) => sum + item.count, 0)}
            </div>
            <div className="text-xs text-muted-foreground">总人数</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* 固定表头 */}
            <div className="sticky top-0 bg-background z-10 border-b">
              <div className="grid" style={{ gridTemplateColumns: "200px 1fr" }}>
                {/* 任务列表标题 */}
                <div className="bg-muted/50 border-r p-3 font-semibold">
                  任务名称
                </div>
                
                {/* 时间轴标题 */}
                <div className="bg-muted/50">
                  <div 
                    className="grid gap-0 h-12"
                    style={{ 
                      gridTemplateColumns: `repeat(${totalDays}, 1fr)`,
                      minWidth: `${totalDays * 40}px`
                    }}
                  >
                    {dateHeaders.map((header) => (
                      <div
                        key={header.day}
                        className={`border-r border-border/50 flex flex-col items-center justify-center text-xs p-1 ${
                          header.dayOfWeek === 0 || header.dayOfWeek === 6 
                            ? 'bg-muted/70 text-muted-foreground' 
                            : ''
                        }`}
                      >
                        <div className="font-medium">{header.date}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {['日', '一', '二', '三', '四', '五', '六'][header.dayOfWeek]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 可滚动的甘特图主体 */}
            <div className="max-h-96 overflow-y-auto">
              <div className="grid" style={{ gridTemplateColumns: "200px 1fr" }}>

              {/* 甘特图主体 */}
              {timelineData.map((item, index) => (
                <div key={item.id} className="contents">
                  {/* 任务名称列 */}
                  <div className="border-r border-b p-3 flex flex-col justify-center">
                    <div className="font-medium text-sm mb-1">{item.task}</div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        style={{ 
                          backgroundColor: `${item.color}20`,
                          color: item.color,
                          borderColor: item.color
                        }}
                        className="text-xs"
                      >
                        {item.worker}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.count}人
                      </span>
                    </div>
                  </div>
                  
                  {/* 甘特条 */}
                  <div className="border-b relative">
                    <div 
                      className="grid gap-0 h-16"
                      style={{ 
                        gridTemplateColumns: `repeat(${totalDays}, 1fr)`,
                        minWidth: `${totalDays * 40}px`
                      }}
                    >
                      {/* 网格背景 */}
                      {dateHeaders.map((header) => (
                        <div
                          key={header.day}
                          className={`border-r border-border/20 ${
                            header.dayOfWeek === 0 || header.dayOfWeek === 6 
                              ? 'bg-muted/30' 
                              : ''
                          }`}
                        />
                      ))}
                      
                      {/* 任务条 */}
                      <div
                        className="absolute top-2 h-12 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-sm animate-fade-in"
                        style={{
                          left: `${(item.startDay / totalDays) * 100}%`,
                          width: `${(item.duration / totalDays) * 100}%`,
                          backgroundColor: item.color,
                          minWidth: '60px'
                        }}
                      >
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
              ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}