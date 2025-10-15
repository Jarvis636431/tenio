
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, TrendingUp } from "lucide-react";

interface EntryExitRecord {
  id: number;
  timestamp: string;
  type: 'entry' | 'exit';
  location?: string;
  note?: string;
}

interface Craftsman {
  id: number;
  name: string;
  trade: string;
  entryCount: number;
}

interface EntryExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  craftsman: Craftsman;
}

// 模拟进出场记录数据
const generateEntryExitRecords = (craftsmanId: number): EntryExitRecord[] => {
  const records: EntryExitRecord[] = [];
  const baseDate = new Date('2025-01-01');
  
  for (let i = 0; i < 20; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    
    // 生成进场记录
    const entryTime = new Date(date);
    entryTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
    
    records.push({
      id: i * 2 + 1,
      timestamp: entryTime.toISOString(),
      type: 'entry',
      location: '工地大门',
      note: '正常进场'
    });
    
    // 生成离场记录
    const exitTime = new Date(date);
    exitTime.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
    
    records.push({
      id: i * 2 + 2,
      timestamp: exitTime.toISOString(),
      type: 'exit',
      location: '工地大门',
      note: '正常离场'
    });
  }
  
  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export function EntryExitDialog({ open, onOpenChange, craftsman }: EntryExitDialogProps) {
  const records = generateEntryExitRecords(craftsman.id);
  
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('zh-CN'),
      time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getRecordIcon = (type: 'entry' | 'exit') => {
    return type === 'entry' ? '→' : '←';
  };

  const getRecordColor = (type: 'entry' | 'exit') => {
    return type === 'entry' ? 'text-category-green-600' : 'text-category-red-600';
  };

  const getRecordBadgeColor = (type: 'entry' | 'exit') => {
    return type === 'entry' ? 'bg-category-green-100 text-category-green-800' : 'bg-category-red-100 text-category-red-800';
  };

  // 统计信息
  const entryRecords = records.filter(r => r.type === 'entry');
  const thisMonthRecords = records.filter(r => {
    const recordDate = new Date(r.timestamp);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  });
  const thisMonthDays = new Set(thisMonthRecords.map(r => formatDateTime(r.timestamp).date)).size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>进出场记录 - {craftsman.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-category-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-category-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总进场次数</p>
                    <p className="text-xl font-bold">{entryRecords.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-category-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-category-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">本月出勤天数</p>
                    <p className="text-xl font-bold">{thisMonthDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-category-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-category-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">平均工作时长</p>
                    <p className="text-xl font-bold">8.5小时</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 记录列表 */}
          <Card>
            <CardHeader>
              <CardTitle>详细记录</CardTitle>
              <CardDescription>最近的进出场记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {records.map((record) => {
                  const { date, time } = formatDateTime(record.timestamp);
                  return (
                     <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                       <div className="flex items-center gap-4">
                         <div className={`text-xl ${getRecordColor(record.type)}`}>
                           {getRecordIcon(record.type)}
                         </div>
                         <div>
                           <div className="flex items-center gap-2">
                             <span className="font-medium">{date} {time}</span>
                             <Badge className={getRecordBadgeColor(record.type)}>
                               {record.type === 'entry' ? '进场' : '离场'}
                             </Badge>
                           </div>
                           <div className="text-sm text-muted-foreground mt-1">
                             <span>地点: {record.location}</span>
                             {record.note && (
                               <span className="ml-4">备注: {record.note}</span>
                             )}
                           </div>
                           {record.type === 'entry' && (
                             <div className="flex items-center gap-1 mt-1">
                               <Badge variant="outline" className="bg-category-green-50 text-category-green-700 border-category-green-200 text-xs">
                                 已完成安全教育
                               </Badge>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
