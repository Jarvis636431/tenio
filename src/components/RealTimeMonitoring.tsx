
import { useState } from "react";
import { Activity, ShoppingCart, Users, DollarSign, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// 修改为每日独立值数据 - 扩展到项目结束日期 8/17
const chartData = {
  procurement: [
    { date: "8/1", value: 25000, plan: 20000 },
    { date: "8/2", value: 35000, plan: 30000 },
    { date: "8/3", value: 28000, plan: 25000 },
    { date: "8/4", value: 42000, plan: 35000 },
    { date: "8/5", value: 38000, plan: 40000 },
    { date: "8/6", value: 45000, plan: 42000 },
    { date: "8/7", value: 32000, plan: 35000 },
    { date: "8/8", value: 48000, plan: 45000 },
    { date: "8/9", value: 36000, plan: 38000 },
    { date: "8/10", value: 52000, plan: 48000 },
    { date: "8/11", value: 41000, plan: 42000 },
    { date: "8/12", value: 47000, plan: 45000 },
    { date: "8/13", value: 39000, plan: 40000 },
    { date: "8/14", value: 44000, plan: 42000 },
    { date: "8/15", value: 36000, plan: 38000 },
    { date: "8/16", value: 49000, plan: 46000 },
    { date: "8/17", value: 43000, plan: 45000 },
  ],
  labor: [
    { date: "8/1", value: 12, plan: 10 },
    { date: "8/2", value: 14, plan: 12 },
    { date: "8/3", value: 11, plan: 13 },
    { date: "8/4", value: 15, plan: 14 },
    { date: "8/5", value: 13, plan: 12 },
    { date: "8/6", value: 16, plan: 15 },
    { date: "8/7", value: 14, plan: 13 },
    { date: "8/8", value: 17, plan: 16 },
    { date: "8/9", value: 15, plan: 14 },
    { date: "8/10", value: 18, plan: 17 },
    { date: "8/11", value: 16, plan: 15 },
    { date: "8/12", value: 19, plan: 18 },
    { date: "8/13", value: 17, plan: 16 },
    { date: "8/14", value: 20, plan: 19 },
    { date: "8/15", value: 18, plan: 17 },
    { date: "8/16", value: 21, plan: 20 },
    { date: "8/17", value: 19, plan: 18 },
  ],
  funding: [
    { date: "8/1", value: 120000, plan: 100000 },
    { date: "8/2", value: 150000, plan: 140000 },
    { date: "8/3", value: 95000, plan: 110000 },
    { date: "8/4", value: 180000, plan: 160000 },
    { date: "8/5", value: 135000, plan: 145000 },
    { date: "8/6", value: 165000, plan: 155000 },
    { date: "8/7", value: 110000, plan: 125000 },
    { date: "8/8", value: 190000, plan: 175000 },
    { date: "8/9", value: 145000, plan: 150000 },
    { date: "8/10", value: 175000, plan: 165000 },
    { date: "8/11", value: 125000, plan: 135000 },
    { date: "8/12", value: 185000, plan: 170000 },
    { date: "8/13", value: 155000, plan: 160000 },
    { date: "8/14", value: 195000, plan: 180000 },
    { date: "8/15", value: 140000, plan: 150000 },
    { date: "8/16", value: 200000, plan: 185000 },
    { date: "8/17", value: 160000, plan: 165000 },
  ],
  materials: [
    { date: "8/1", value: 85, plan: 80 },
    { date: "8/2", value: 92, plan: 88 },
    { date: "8/3", value: 78, plan: 85 },
    { date: "8/4", value: 95, plan: 90 },
    { date: "8/5", value: 88, plan: 85 },
    { date: "8/6", value: 96, plan: 92 },
    { date: "8/7", value: 89, plan: 88 },
    { date: "8/8", value: 93, plan: 90 },
    { date: "8/9", value: 87, plan: 89 },
    { date: "8/10", value: 94, plan: 91 },
    { date: "8/11", value: 90, plan: 88 },
    { date: "8/12", value: 97, plan: 94 },
    { date: "8/13", value: 91, plan: 89 },
    { date: "8/14", value: 95, plan: 93 },
    { date: "8/15", value: 88, plan: 90 },
    { date: "8/16", value: 98, plan: 95 },
    { date: "8/17", value: 92, plan: 90 },
  ],
};

const chartConfig = {
  procurement: {
    title: "采购进度",
    description: "每日材料采购金额与计划对比",
    icon: ShoppingCart,
    color: "#3b82f6",
    unit: "元",
    isCumulative: true
  },
  labor: {
    title: "劳动力配置",
    description: "每日现场施工人员数量变化",
    icon: Users,
    color: "#10b981",
    unit: "人",
    isCumulative: false
  },
  funding: {
    title: "资金使用",
    description: "每日项目资金支出与预算对比",
    icon: DollarSign,
    color: "#f59e0b",
    unit: "元",
    isCumulative: true
  },
  materials: {
    title: "物料供应",
    description: "每日物料供应及时率监控",
    icon: Package,
    color: "#ef4444",
    unit: "%",
    isCumulative: false
  }
};

// 物料类型数据 - 修改为每日独立值，扩展到 8/17
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
      { date: "8/8", value: 93, plan: 90 },
      { date: "8/9", value: 87, plan: 89 },
      { date: "8/10", value: 94, plan: 91 },
      { date: "8/11", value: 90, plan: 88 },
      { date: "8/12", value: 97, plan: 94 },
      { date: "8/13", value: 91, plan: 89 },
      { date: "8/14", value: 95, plan: 93 },
      { date: "8/15", value: 88, plan: 90 },
      { date: "8/16", value: 98, plan: 95 },
      { date: "8/17", value: 92, plan: 90 },
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
      { date: "8/8", value: 89, plan: 95 },
      { date: "8/9", value: 96, plan: 91 },
      { date: "8/10", value: 93, plan: 94 },
      { date: "8/11", value: 99, plan: 96 },
      { date: "8/12", value: 91, plan: 97 },
      { date: "8/13", value: 94, plan: 92 },
      { date: "8/14", value: 88, plan: 95 },
      { date: "8/15", value: 97, plan: 90 },
      { date: "8/16", value: 95, plan: 98 },
      { date: "8/17", value: 100, plan: 96 },
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
      { date: "8/8", value: 87, plan: 92 },
      { date: "8/9", value: 95, plan: 89 },
      { date: "8/10", value: 92, plan: 93 },
      { date: "8/11", value: 88, plan: 90 },
      { date: "8/12", value: 96, plan: 93 },
      { date: "8/13", value: 90, plan: 87 },
      { date: "8/14", value: 94, plan: 92 },
      { date: "8/15", value: 91, plan: 89 },
      { date: "8/16", value: 97, plan: 94 },
      { date: "8/17", value: 89, plan: 91 },
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
      { date: "8/8", value: 88, plan: 89 },
      { date: "8/9", value: 96, plan: 93 },
      { date: "8/10", value: 90, plan: 87 },
      { date: "8/11", value: 93, plan: 95 },
      { date: "8/12", value: 89, plan: 91 },
      { date: "8/13", value: 97, plan: 94 },
      { date: "8/14", value: 92, plan: 89 },
      { date: "8/15", value: 95, plan: 97 },
      { date: "8/16", value: 88, plan: 93 },
      { date: "8/17", value: 99, plan: 96 },
    ]
  }
};

// 计算统计值的辅助函数
const calculateStats = (data: Array<{value: number, plan: number}>, isCumulative: boolean) => {
  if (isCumulative) {
    // 累积类指标：计算总和
    const totalActual = data.reduce((sum, item) => sum + item.value, 0);
    const totalPlan = data.reduce((sum, item) => sum + item.plan, 0);
    return { current: totalActual, plan: totalPlan };
  } else {
    // 即时类指标：使用最新值
    const latest = data[data.length - 1];
    return { current: latest.value, plan: latest.plan };
  }
};

export function RealTimeMonitoring() {
  const [activeChart, setActiveChart] = useState<keyof typeof chartData>("procurement");
  const [selectedMaterialType, setSelectedMaterialType] = useState<keyof typeof materialTypesData>("concrete");
  
  const config = chartConfig[activeChart];
  const data = chartData[activeChart];

  return (
    <div className="p-6 space-y-6">
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
          const currentConfig = chartConfig[key as keyof typeof chartConfig];
          
          // 计算统计值
          const stats = calculateStats(displayData, currentConfig.isCumulative);
          
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
                    <CardTitle className="text-sm font-medium">
                      {currentConfig.isCumulative ? "累计实际值" : "当前值"}
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" style={{ color: currentConfig.color }}>
                      {stats.current.toLocaleString()}{currentConfig.unit}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentConfig.isCumulative 
                        ? `项目累计${currentConfig.title.replace('进度', '').replace('使用', '').replace('配置', '').replace('供应', '')}`
                        : (isMateriasTab ? `${materialTypesData[selectedMaterialType].name}最新供应率` : '最新数据点')
                      }
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {currentConfig.isCumulative ? "累计计划值" : "计划值"}
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">
                      {stats.plan.toLocaleString()}{currentConfig.unit}
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
                      {Math.round((stats.current / stats.plan) * 100)}%
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
                      const IconComponent = currentConfig.icon;
                      return <IconComponent className="h-5 w-5" />;
                    })()}
                    {currentConfig.title}
                    {isMateriasTab && (
                      <span className="text-base font-normal text-muted-foreground">
                        - {materialTypesData[selectedMaterialType].name}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isMateriasTab 
                      ? `${materialTypesData[selectedMaterialType].name}每日供应及时率监控`
                      : currentConfig.description
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      value: {
                        label: "实际值",
                        color: currentConfig.color,
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
                          tickFormatter={(value) => `${value}${currentConfig.unit}`}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) => [
                                `${value}${currentConfig.unit}`,
                                name === "value" ? "实际值" : "计划值"
                              ]}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={currentConfig.color}
                          strokeWidth={3}
                          dot={{ fill: currentConfig.color, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: currentConfig.color, strokeWidth: 2 }}
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
