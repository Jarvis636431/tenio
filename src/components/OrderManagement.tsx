
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OrderManagement() {
  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">订单管理</h1>
        <p className="text-muted-foreground">采购订单和供应商管理</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>订单管理功能</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            订单管理功能正在开发中，请告诉我您希望在这个页面中包含什么具体功能。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
