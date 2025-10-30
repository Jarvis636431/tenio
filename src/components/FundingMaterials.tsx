import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Warehouse, PiggyBank } from "lucide-react";

const fundingSummary = [
  {
    title: "合同总额",
    value: "¥ 32,000,000",
    description: "本期项目预算",
    icon: PiggyBank,
  },
  {
    title: "已支付",
    value: "¥ 18,600,000",
    description: "占总额 58%",
    trend: "up",
    trendText: "+6% 较上期",
  },
  {
    title: "待支付",
    value: "¥ 13,400,000",
    description: "计划本季度完成",
    trend: "down",
    trendText: "-2% 较计划",
  },
];

const materialInventory = [
  {
    name: "钢筋 HRB400",
    specification: "φ16 / φ20",
    supplier: "河北钢铁",
    stock: "42 吨",
    status: "库存充足",
    consumptionRate: 68,
  },
  {
    name: "混凝土 C40",
    specification: "泵送",
    supplier: "中建商砼",
    stock: "1,250 立方",
    status: "按计划供应",
    consumptionRate: 54,
  },
  {
    name: "防水卷材",
    specification: "SBS 改性沥青 4mm",
    supplier: "东方雨虹",
    stock: "12,000 平米",
    status: "即将补货",
    consumptionRate: 82,
  },
  {
    name: "脚手架钢管",
    specification: "Φ48.3×3.6mm",
    supplier: "天友租赁",
    stock: "1,800 套",
    status: "正常",
    consumptionRate: 37,
  },
];

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "库存充足": "secondary",
  "按计划供应": "default",
  "即将补货": "destructive",
  正常: "outline",
};

interface FundingMaterialsProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

export function FundingMaterials({}: FundingMaterialsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fundingSummary.map((item) => {
          const Icon = item.icon ?? (item.trend === "up" ? TrendingUp : item.trend === "down" ? TrendingDown : Warehouse);
          return (
            <Card key={item.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{item.value}</div>
                <CardDescription>{item.description}</CardDescription>
                {item.trendText && (
                  <div className="mt-2 text-xs text-muted-foreground">{item.trendText}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>材料库存与消耗</CardTitle>
          <CardDescription>追踪关键材料库存状态与本月消耗</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">材料名称</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>供应商</TableHead>
                  <TableHead>库存</TableHead>
                  <TableHead className="w-40">状态</TableHead>
                  <TableHead className="w-60">本月消耗占比</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialInventory.map((material) => (
                  <TableRow key={material.name}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.specification}</TableCell>
                    <TableCell>{material.supplier}</TableCell>
                    <TableCell>{material.stock}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[material.status] ?? "default"}>
                        {material.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={material.consumptionRate} />
                        <p className="text-xs text-muted-foreground">
                          {material.consumptionRate}% 已消耗
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
