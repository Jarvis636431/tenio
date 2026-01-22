import { Card, CardContent } from "@/components/ui/card";

export function NetworkDiagram() {
  return (
    <div className="h-full w-full">
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">网络图开发中</h3>
            <p>这里将展示项目的网络计划图（PERT/CPM）</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
