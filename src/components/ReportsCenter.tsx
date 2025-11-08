import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportsCenter() {
  return (
    <div className="h-full flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>时间流程</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            这里是“时间流程”的占位页面。你可以在此集成工期流程视图、统计图表、筛选条件与导出功能。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportsCenter;