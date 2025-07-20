
import { useState } from "react";
import { Activity, ShoppingCart, Users, DollarSign, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// 模拟数据
const chartData = {
  procurement: [
    { date: "8/1", value: 120000, plan: 100000 },
    { date: "8/2", value: 150000, plan: 120000 },
    { date: "8/3", value: 180000, plan: 150000 },
    { date: "8/4", value: 200000, plan: 180000 },
    { date: "8/5", value: 230000, plan: 200000 },
    { date: "8/6", value: 250000, plan: 230000 },
    { date: "8/7", value: 280000, plan: 250000 },
  ],
  labor: [
    { date: "8/1", value: 12, plan: 10 },
    { date: "8/2", value: 15, plan: 14 },
    { date: "8/3", value: 18, plan: 16 },
    { date: "8/4", value: 20, plan: 18 },
    { date: "8/5", value: 22, plan: 20 },
    { date: "8/6", value: 25, plan: 22 },
    { date: "8/7", value: 28, plan: 25 },
  ],
  funding: [
    { date: "8/1", value: 500000, plan: 480000 },
    { date: "8/2", value: 620000, plan: 600000 },
    { date: "8/3", value: 750000, plan: 720000 },
    { date: "8/4", value: 880000, plan: 850000 },
    { date: "8/5", value: 950000, plan: 920000 },
    { date: "8/6", value: 1100000, plan: 1050000 },
    { date: "8/7", value: 1200000, plan: 1180000 },
  ],
  materials: [
    { date: "8/1", value: 85, plan: 80 },
    { date: "8/2", value: 92, plan: 88 },
    { date: "8/3", value: 78, plan: 85 },
    { date: "8/4", value: 95, plan: 90 },
    { date: "8/5", value: 88, plan: 85 },
    { date: "8/6", value: 96, plan: 92 },
    { date: "8/7", value: 89, plan: 88 },
  ],
};

const chartConfig = {
  procurement: {
    title: "采购进度",
    description: "材料采购金额与计划对比",
    icon: ShoppingCart,
    color: "#3b82f6",
    unit: "元"
  },
  labor: {
    title: "劳动力配置",
    description: "现场施工人员数量变化",
    icon: Users,
    color: "#10b981",
    unit: "人"
  },
  funding: {
    title: "资金使用",
    description: "项目资金投入与预算对比",
    icon: DollarSign,
    color: "#f59e0b",
    unit: "元"
  },
  materials: {
    title: "物料供应",
    description: "物料供应及时率监控",
    icon: Package,
    color: "#ef4444",
    unit: "%"
  }
};

// 物料类型数据
const materialTypesData = {
  concrete: {
    name: "混凝土",
    data: [
      { date: "8/1", value: 85, plan: 80 },
      { date: "8/2", value: 92, plan: 88 },
      { date: "8/3", value: 78, plan: 85 },
      { date: "8/4", value: 95, plan: 90 },
      { date: "8/5", value: 88, plan: 85 },
      { date: "8/6", value: 96, plan: 92 },
      { date: "8/7", value: 89, plan: 88 },
    ]
  },
  steel: {
    name: "钢筋",
    data: [
      { date: "8/1", value: 90, plan: 85 },
      { date: "8/2", value: 87, plan: 90 },
      { date: "8/3", value: 95, plan: 88 },
      { date: "8/4", value: 92, plan: 95 },
      { date: "8/5", value: 98, plan: 92 },
      { date: "8/6", value: 94, plan: 96 },
      { date: "8/7", value: 97, plan: 94 },
    ]
  },
  blocks: {
    name: "空心混凝土砌块",
    data: [
      { date: "8/1", value: 75, plan: 80 },
      { date: "8/2", value: 82, plan: 78 },
      { date: "8/3", value: 88, plan: 85 },
      { date: "8/4", value: 86, plan: 88 },
      { date: "8/5", value: 91, plan: 86 },
      { date: "8/6", value: 89, plan: 90 },
      { date: "8/7", value: 93, plan: 89 },
    ]
  },
  mortar: {
    name: "砂浆",
    data: [
      { date: "8/1", value: 80, plan: 75 },
      { date: "8/2", value: 85, plan: 82 },
      { date: "8/3", value: 78, plan: 80 },
      { date: "8/4", value: 92, plan: 85 },
      { date: "8/5", value: 87, plan: 90 },
      { date: "8/6", value: 94, plan: 87 },
      { date: "8/7", value: 91, plan: 92 },
    ]
  }
};

export function RealTimeMonitoring() {
  const [activeChart, setActiveChart] = useState<keyof typeof chartData>("procurement");
  const [selectedMaterialType, setSelectedMaterialType] = useState<keyof typeof materialTypesData>("concrete");
  
  const config = chartConfig[activeChart];
  const data = chartData[activeChart];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">实时监测</h1>
        <p className="text-muted-foreground">项目关键指标的实时监控与分析</p>
      </div>

      <Tabs value={activeChart} onValueChange={(value) => setActiveChart(value as keyof typeof chartData)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(chartConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(chartData).map(([key, data]) => {
          // 对于物料供应标签页，使用选中的物料类型数据
          const isMateriasTab = key === 'materials';
          const displayData = isMateriasTab ? materialTypesData[selectedMaterialType].data : data;
          
          return (
            <TabsContent key={key} value={key} className="space-y-4">
              {/* 物料类型选择器 - 仅在物料供应标签页显示 */}
              {isMateriasTab && (
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">物料类型:</span>
                  <Select 
                    value={selectedMaterialType} 
                    onValueChange={(value) => setSelectedMaterialType(value as keyof typeof materialTypesData)}
                  >
                    <SelectTrigger className="w-48 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border">
                      {Object.entries(materialTypesData).map(([typeKey, typeData]) => (
                        <SelectItem key={typeKey} value={typeKey}>
                          {typeData.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 统计卡片 */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">当前值</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" style={{ color: chartConfig[key as keyof typeof chartConfig].color }}>
                      {displayData[displayData.length - 1]?.value.toLocaleString()}{chartConfig[key as keyof typeof chartConfig].unit}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isMateriasTab ? `${materialTypesData[selectedMaterialType].name}最新供应率` : '最新数据点'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">计划值</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">
                      {displayData[displayData.length - 1]?.plan.toLocaleString()}{chartConfig[key as keyof typeof chartConfig].unit}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      预期目标
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">完成率</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((displayData[displayData.length - 1]?.value / displayData[displayData.length - 1]?.plan) * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      相对于计划
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = chartConfig[key as keyof typeof chartConfig].icon;
                      return <IconComponent className="h-5 w-5" />;
                    })()}
                    {chartConfig[key as keyof typeof chartConfig].title}
                    {isMateriasTab && (
                      <span className="text-base font-normal text-muted-foreground">
                        - {materialTypesData[selectedMaterialType].name}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isMateriasTab 
                      ? `${materialTypesData[selectedMaterialType].name}供应及时率监控`
                      : chartConfig[key as keyof typeof chartConfig].description
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      value: {
                        label: "实际值",
                        color: chartConfig[key as keyof typeof chartConfig].color,
                      },
                      plan: {
                        label: "计划值",
                        color: "#94a3b8",
                      },
                    }}
                    className="h-[400px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={displayData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          className="text-muted-foreground"
                          fontSize={12}
                        />
                        <YAxis 
                          className="text-muted-foreground"
                          fontSize={12}
                          tickFormatter={(value) => `${value}${chartConfig[key as keyof typeof chartConfig].unit}`}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) => [
                                `${value}${chartConfig[key as keyof typeof chartConfig].unit}`,
                                name === "value" ? "实际值" : "计划值"
                              ]}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={chartConfig[key as keyof typeof chartConfig].color}
                          strokeWidth={3}
                          dot={{ fill: chartConfig[key as keyof typeof chartConfig].color, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: chartConfig[key as keyof typeof chartConfig].color, strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="plan"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: "#94a3b8", strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
