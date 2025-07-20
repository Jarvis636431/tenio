import { useState } from "react";
import { Activity, ShoppingCart, Users, DollarSign, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// 修改为每日独立值数据 - 扩展到项目结束日期 8/17
const chartData = {
  procurement: [{
    date: "8/1",
    value: 25000,
    plan: 20000
  }, {
    date: "8/2",
    value: 35000,
    plan: 30000
  }, {
    date: "8/3",
    value: 28000,
    plan: 25000
  }, {
    date: "8/4",
    value: 42000,
    plan: 35000
  }, {
    date: "8/5",
    value: 38000,
    plan: 40000
  }, {
    date: "8/6",
    value: 45000,
    plan: 42000
  }, {
    date: "8/7",
    value: 32000,
    plan: 35000
  }, {
    date: "8/8",
    value: 48000,
    plan: 45000
  }, {
    date: "8/9",
    value: 36000,
    plan: 38000
  }, {
    date: "8/10",
    value: 52000,
    plan: 48000
  }, {
    date: "8/11",
    value: 41000,
    plan: 42000
  }, {
    date: "8/12",
    value: 47000,
    plan: 45000
  }, {
    date: "8/13",
    value: 39000,
    plan: 40000
  }, {
    date: "8/14",
    value: 44000,
    plan: 42000
  }, {
    date: "8/15",
    value: 36000,
    plan: 38000
  }, {
    date: "8/16",
    value: 49000,
    plan: 46000
  }, {
    date: "8/17",
    value: 43000,
    plan: 45000
  }],
  labor: [{
    date: "8/1",
    value: 12,
    plan: 10
  }, {
    date: "8/2",
    value: 14,
    plan: 12
  }, {
    date: "8/3",
    value: 11,
    plan: 13
  }, {
    date: "8/4",
    value: 15,
    plan: 14
  }, {
    date: "8/5",
    value: 13,
    plan: 12
  }, {
    date: "8/6",
    value: 16,
    plan: 15
  }, {
    date: "8/7",
    value: 14,
    plan: 13
  }, {
    date: "8/8",
    value: 17,
    plan: 16
  }, {
    date: "8/9",
    value: 15,
    plan: 14
  }, {
    date: "8/10",
    value: 18,
    plan: 17
  }, {
    date: "8/11",
    value: 16,
    plan: 15
  }, {
    date: "8/12",
    value: 19,
    plan: 18
  }, {
    date: "8/13",
    value: 17,
    plan: 16
  }, {
    date: "8/14",
    value: 20,
    plan: 19
  }, {
    date: "8/15",
    value: 18,
    plan: 17
  }, {
    date: "8/16",
    value: 21,
    plan: 20
  }, {
    date: "8/17",
    value: 19,
    plan: 18
  }],
  funding: [{
    date: "8/1",
    value: 120000,
    plan: 100000
  }, {
    date: "8/2",
    value: 150000,
    plan: 140000
  }, {
    date: "8/3",
    value: 95000,
    plan: 110000
  }, {
    date: "8/4",
    value: 180000,
    plan: 160000
  }, {
    date: "8/5",
    value: 135000,
    plan: 145000
  }, {
    date: "8/6",
    value: 165000,
    plan: 155000
  }, {
    date: "8/7",
    value: 110000,
    plan: 125000
  }, {
    date: "8/8",
    value: 190000,
    plan: 175000
  }, {
    date: "8/9",
    value: 145000,
    plan: 150000
  }, {
    date: "8/10",
    value: 175000,
    plan: 165000
  }, {
    date: "8/11",
    value: 125000,
    plan: 135000
  }, {
    date: "8/12",
    value: 185000,
    plan: 170000
  }, {
    date: "8/13",
    value: 155000,
    plan: 160000
  }, {
    date: "8/14",
    value: 195000,
    plan: 180000
  }, {
    date: "8/15",
    value: 140000,
    plan: 150000
  }, {
    date: "8/16",
    value: 200000,
    plan: 185000
  }, {
    date: "8/17",
    value: 160000,
    plan: 165000
  }],
  materials: [{
    date: "8/1",
    value: 85,
    plan: 80
  }, {
    date: "8/2",
    value: 92,
    plan: 88
  }, {
    date: "8/3",
    value: 78,
    plan: 85
  }, {
    date: "8/4",
    value: 95,
    plan: 90
  }, {
    date: "8/5",
    value: 88,
    plan: 85
  }, {
    date: "8/6",
    value: 96,
    plan: 92
  }, {
    date: "8/7",
    value: 89,
    plan: 88
  }, {
    date: "8/8",
    value: 93,
    plan: 90
  }, {
    date: "8/9",
    value: 87,
    plan: 89
  }, {
    date: "8/10",
    value: 94,
    plan: 91
  }, {
    date: "8/11",
    value: 90,
    plan: 88
  }, {
    date: "8/12",
    value: 97,
    plan: 94
  }, {
    date: "8/13",
    value: 91,
    plan: 89
  }, {
    date: "8/14",
    value: 95,
    plan: 93
  }, {
    date: "8/15",
    value: 88,
    plan: 90
  }, {
    date: "8/16",
    value: 98,
    plan: 95
  }, {
    date: "8/17",
    value: 92,
    plan: 90
  }]
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
    description: "每日物料供应量监控",
    icon: Package,
    color: "#ef4444",
    unit: "", // 动态单位，根据选中的材料类型确定
    isCumulative: false
  }
};

// 物料类型数据 - 修改为实际单位和数量，扩展到 8/17
const materialTypesData = {
  concrete: {
    name: "混凝土",
    unit: "m³",
    data: [{
      date: "8/1",
      value: 120,
      plan: 100
    }, {
      date: "8/2",
      value: 135,
      plan: 125
    }, {
      date: "8/3",
      value: 95,
      plan: 110
    }, {
      date: "8/4",
      value: 150,
      plan: 130
    }, {
      date: "8/5",
      value: 125,
      plan: 120
    }, {
      date: "8/6",
      value: 165,
      plan: 145
    }, {
      date: "8/7",
      value: 110,
      plan: 115
    }, {
      date: "8/8",
      value: 180,
      plan: 160
    }, {
      date: "8/9",
      value: 140,
      plan: 135
    }, {
      date: "8/10",
      value: 195,
      plan: 175
    }, {
      date: "8/11",
      value: 155,
      plan: 150
    }, {
      date: "8/12",
      value: 210,
      plan: 185
    }, {
      date: "8/13",
      value: 170,
      plan: 165
    }, {
      date: "8/14",
      value: 225,
      plan: 200
    }, {
      date: "8/15",
      value: 185,
      plan: 180
    }, {
      date: "8/16",
      value: 240,
      plan: 215
    }, {
      date: "8/17",
      value: 200,
      plan: 195
    }]
  },
  steel: {
    name: "钢筋",
    unit: "t",
    data: [{
      date: "8/1",
      value: 12,
      plan: 10
    }, {
      date: "8/2",
      value: 15,
      plan: 14
    }, {
      date: "8/3",
      value: 8,
      plan: 12
    }, {
      date: "8/4",
      value: 18,
      plan: 16
    }, {
      date: "8/5",
      value: 14,
      plan: 15
    }, {
      date: "8/6",
      value: 20,
      plan: 18
    }, {
      date: "8/7",
      value: 11,
      plan: 13
    }, {
      date: "8/8",
      value: 22,
      plan: 20
    }, {
      date: "8/9",
      value: 16,
      plan: 17
    }, {
      date: "8/10",
      value: 25,
      plan: 22
    }, {
      date: "8/11",
      value: 19,
      plan: 18
    }, {
      date: "8/12",
      value: 28,
      plan: 25
    }, {
      date: "8/13",
      value: 21,
      plan: 20
    }, {
      date: "8/14",
      value: 30,
      plan: 27
    }, {
      date: "8/15",
      value: 24,
      plan: 22
    }, {
      date: "8/16",
      value: 32,
      plan: 29
    }, {
      date: "8/17",
      value: 26,
      plan: 25
    }]
  },
  blocks: {
    name: "空心混凝土砌块",
    unit: "m²",
    data: [{
      date: "8/1",
      value: 180,
      plan: 200
    }, {
      date: "8/2",
      value: 220,
      plan: 210
    }, {
      date: "8/3",
      value: 160,
      plan: 190
    }, {
      date: "8/4",
      value: 250,
      plan: 230
    }, {
      date: "8/5",
      value: 210,
      plan: 220
    }, {
      date: "8/6",
      value: 280,
      plan: 260
    }, {
      date: "8/7",
      value: 190,
      plan: 200
    }, {
      date: "8/8",
      value: 300,
      plan: 280
    }, {
      date: "8/9",
      value: 240,
      plan: 250
    }, {
      date: "8/10",
      value: 320,
      plan: 300
    }, {
      date: "8/11",
      value: 260,
      plan: 270
    }, {
      date: "8/12",
      value: 340,
      plan: 320
    }, {
      date: "8/13",
      value: 280,
      plan: 290
    }, {
      date: "8/14",
      value: 360,
      plan: 340
    }, {
      date: "8/15",
      value: 300,
      plan: 310
    }, {
      date: "8/16",
      value: 380,
      plan: 360
    }, {
      date: "8/17",
      value: 320,
      plan: 330
    }]
  },
  mortar: {
    name: "砂浆",
    unit: "m³",
    data: [{
      date: "8/1",
      value: 45,
      plan: 40
    }, {
      date: "8/2",
      value: 52,
      plan: 48
    }, {
      date: "8/3",
      value: 38,
      plan: 45
    }, {
      date: "8/4",
      value: 58,
      plan: 52
    }, {
      date: "8/5",
      value: 48,
      plan: 50
    }, {
      date: "8/6",
      value: 62,
      plan: 58
    }, {
      date: "8/7",
      value: 42,
      plan: 46
    }, {
      date: "8/8",
      value: 68,
      plan: 62
    }, {
      date: "8/9",
      value: 54,
      plan: 56
    }, {
      date: "8/10",
      value: 72,
      plan: 68
    }, {
      date: "8/11",
      value: 58,
      plan: 60
    }, {
      date: "8/12",
      value: 78,
      plan: 72
    }, {
      date: "8/13",
      value: 64,
      plan: 66
    }, {
      date: "8/14",
      value: 82,
      plan: 78
    }, {
      date: "8/15",
      value: 68,
      plan: 70
    }, {
      date: "8/16",
      value: 86,
      plan: 82
    }, {
      date: "8/17",
      value: 74,
      plan: 76
    }]
  }
};

// 劳动力工种数据
const laborTypesData = {
  carpenter: {
    name: "木工",
    data: [{
      date: "8/1",
      value: 8,
      plan: 10
    }, {
      date: "8/2",
      value: 10,
      plan: 9
    }, {
      date: "8/3",
      value: 9,
      plan: 11
    }, {
      date: "8/4",
      value: 12,
      plan: 10
    }, {
      date: "8/5",
      value: 11,
      plan: 10
    }, {
      date: "8/6",
      value: 10,
      plan: 12
    }, {
      date: "8/7",
      value: 9,
      plan: 11
    }, {
      date: "8/8",
      value: 11,
      plan: 10
    }, {
      date: "8/9",
      value: 10,
      plan: 12
    }, {
      date: "8/10",
      value: 12,
      plan: 11
    }, {
      date: "8/11",
      value: 11,
      plan: 10
    }, {
      date: "8/12",
      value: 10,
      plan: 12
    }, {
      date: "8/13",
      value: 9,
      plan: 11
    }, {
      date: "8/14",
      value: 12,
      plan: 10
    }, {
      date: "8/15",
      value: 11,
      plan: 11
    }, {
      date: "8/16",
      value: 10,
      plan: 12
    }, {
      date: "8/17",
      value: 11,
      plan: 10
    }]
  },
  steelworker: {
    name: "钢筋工",
    data: [{
      date: "8/1",
      value: 6,
      plan: 8
    }, {
      date: "8/2",
      value: 8,
      plan: 7
    }, {
      date: "8/3",
      value: 7,
      plan: 9
    }, {
      date: "8/4",
      value: 9,
      plan: 8
    }, {
      date: "8/5",
      value: 8,
      plan: 8
    }, {
      date: "8/6",
      value: 10,
      plan: 9
    }, {
      date: "8/7",
      value: 9,
      plan: 8
    }, {
      date: "8/8",
      value: 8,
      plan: 10
    }, {
      date: "8/9",
      value: 7,
      plan: 9
    }, {
      date: "8/10",
      value: 10,
      plan: 8
    }, {
      date: "8/11",
      value: 9,
      plan: 9
    }, {
      date: "8/12",
      value: 8,
      plan: 10
    }, {
      date: "8/13",
      value: 10,
      plan: 8
    }, {
      date: "8/14",
      value: 9,
      plan: 9
    }, {
      date: "8/15",
      value: 8,
      plan: 10
    }, {
      date: "8/16",
      value: 10,
      plan: 8
    }, {
      date: "8/17",
      value: 9,
      plan: 9
    }]
  },
  concreter: {
    name: "混凝土工",
    data: [{
      date: "8/1",
      value: 4,
      plan: 6
    }, {
      date: "8/2",
      value: 6,
      plan: 5
    }, {
      date: "8/3",
      value: 5,
      plan: 7
    }, {
      date: "8/4",
      value: 7,
      plan: 6
    }, {
      date: "8/5",
      value: 6,
      plan: 6
    }, {
      date: "8/6",
      value: 8,
      plan: 7
    }, {
      date: "8/7",
      value: 7,
      plan: 6
    }, {
      date: "8/8",
      value: 6,
      plan: 8
    }, {
      date: "8/9",
      value: 5,
      plan: 7
    }, {
      date: "8/10",
      value: 8,
      plan: 6
    }, {
      date: "8/11",
      value: 7,
      plan: 7
    }, {
      date: "8/12",
      value: 6,
      plan: 8
    }, {
      date: "8/13",
      value: 8,
      plan: 6
    }, {
      date: "8/14",
      value: 7,
      plan: 7
    }, {
      date: "8/15",
      value: 6,
      plan: 8
    }, {
      date: "8/16",
      value: 8,
      plan: 6
    }, {
      date: "8/17",
      value: 7,
      plan: 7
    }]
  },
  electrician: {
    name: "电工",
    data: [{
      date: "8/1",
      value: 2,
      plan: 3
    }, {
      date: "8/2",
      value: 3,
      plan: 2
    }, {
      date: "8/3",
      value: 2,
      plan: 4
    }, {
      date: "8/4",
      value: 4,
      plan: 3
    }, {
      date: "8/5",
      value: 3,
      plan: 3
    }, {
      date: "8/6",
      value: 4,
      plan: 3
    }, {
      date: "8/7",
      value: 3,
      plan: 3
    }, {
      date: "8/8",
      value: 3,
      plan: 4
    }, {
      date: "8/9",
      value: 2,
      plan: 3
    }, {
      date: "8/10",
      value: 4,
      plan: 3
    }, {
      date: "8/11",
      value: 3,
      plan: 3
    }, {
      date: "8/12",
      value: 3,
      plan: 4
    }, {
      date: "8/13",
      value: 4,
      plan: 3
    }, {
      date: "8/14",
      value: 3,
      plan: 3
    }, {
      date: "8/15",
      value: 3,
      plan: 4
    }, {
      date: "8/16",
      value: 4,
      plan: 3
    }, {
      date: "8/17",
      value: 3,
      plan: 3
    }]
  }
};

// 资金类型数据
const fundingTypesData = {
  total: {
    name: "总资金",
    data: chartData.funding
  },
  labor_cost: {
    name: "人工费用",
    data: [{
      date: "8/1",
      value: 35000,
      plan: 30000
    }, {
      date: "8/2",
      value: 42000,
      plan: 40000
    }, {
      date: "8/3",
      value: 28000,
      plan: 35000
    }, {
      date: "8/4",
      value: 50000,
      plan: 45000
    }, {
      date: "8/5",
      value: 38000,
      plan: 42000
    }, {
      date: "8/6",
      value: 48000,
      plan: 45000
    }, {
      date: "8/7",
      value: 32000,
      plan: 38000
    }, {
      date: "8/8",
      value: 55000,
      plan: 50000
    }, {
      date: "8/9",
      value: 42000,
      plan: 45000
    }, {
      date: "8/10",
      value: 52000,
      plan: 48000
    }, {
      date: "8/11",
      value: 38000,
      plan: 42000
    }, {
      date: "8/12",
      value: 58000,
      plan: 52000
    }, {
      date: "8/13",
      value: 45000,
      plan: 48000
    }, {
      date: "8/14",
      value: 60000,
      plan: 55000
    }, {
      date: "8/15",
      value: 40000,
      plan: 45000
    }, {
      date: "8/16",
      value: 58000,
      plan: 55000
    }, {
      date: "8/17",
      value: 48000,
      plan: 50000
    }]
  },
  material_cost: {
    name: "材料费用",
    data: [{
      date: "8/1",
      value: 55000,
      plan: 50000
    }, {
      date: "8/2",
      value: 65000,
      plan: 60000
    }, {
      date: "8/3",
      value: 48000,
      plan: 55000
    }, {
      date: "8/4",
      value: 75000,
      plan: 70000
    }, {
      date: "8/5",
      value: 62000,
      plan: 65000
    }, {
      date: "8/6",
      value: 78000,
      plan: 72000
    }, {
      date: "8/7",
      value: 52000,
      plan: 58000
    }, {
      date: "8/8",
      value: 80000,
      plan: 75000
    }, {
      date: "8/9",
      value: 68000,
      plan: 70000
    }, {
      date: "8/10",
      value: 82000,
      plan: 78000
    }, {
      date: "8/11",
      value: 58000,
      plan: 65000
    }, {
      date: "8/12",
      value: 85000,
      plan: 80000
    }, {
      date: "8/13",
      value: 72000,
      plan: 75000
    }, {
      date: "8/14",
      value: 88000,
      plan: 82000
    }, {
      date: "8/15",
      value: 65000,
      plan: 70000
    }, {
      date: "8/16",
      value: 85000,
      plan: 82000
    }, {
      date: "8/17",
      value: 75000,
      plan: 78000
    }]
  },
  equipment_cost: {
    name: "设备费用",
    data: [{
      date: "8/1",
      value: 22000,
      plan: 20000
    }, {
      date: "8/2",
      value: 28000,
      plan: 25000
    }, {
      date: "8/3",
      value: 18000,
      plan: 22000
    }, {
      date: "8/4",
      value: 35000,
      plan: 30000
    }, {
      date: "8/5",
      value: 25000,
      plan: 28000
    }, {
      date: "8/6",
      value: 32000,
      plan: 30000
    }, {
      date: "8/7",
      value: 20000,
      plan: 25000
    }, {
      date: "8/8",
      value: 38000,
      plan: 35000
    }, {
      date: "8/9",
      value: 28000,
      plan: 30000
    }, {
      date: "8/10",
      value: 35000,
      plan: 32000
    }, {
      date: "8/11",
      value: 22000,
      plan: 28000
    }, {
      date: "8/12",
      value: 40000,
      plan: 38000
    }, {
      date: "8/13",
      value: 30000,
      plan: 32000
    }, {
      date: "8/14",
      value: 42000,
      plan: 38000
    }, {
      date: "8/15",
      value: 25000,
      plan: 30000
    }, {
      date: "8/16",
      value: 40000,
      plan: 38000
    }, {
      date: "8/17",
      value: 32000,
      plan: 35000
    }]
  },
  management_cost: {
    name: "管理费用",
    data: [{
      date: "8/1",
      value: 12000,
      plan: 10000
    }, {
      date: "8/2",
      value: 15000,
      plan: 14000
    }, {
      date: "8/3",
      value: 8000,
      plan: 12000
    }, {
      date: "8/4",
      value: 18000,
      plan: 16000
    }, {
      date: "8/5",
      value: 14000,
      plan: 15000
    }, {
      date: "8/6",
      value: 20000,
      plan: 18000
    }, {
      date: "8/7",
      value: 10000,
      plan: 14000
    }, {
      date: "8/8",
      value: 22000,
      plan: 20000
    }, {
      date: "8/9",
      value: 16000,
      plan: 18000
    }, {
      date: "8/10",
      value: 20000,
      plan: 18000
    }, {
      date: "8/11",
      value: 12000,
      plan: 16000
    }, {
      date: "8/12",
      value: 24000,
      plan: 22000
    }, {
      date: "8/13",
      value: 18000,
      plan: 20000
    }, {
      date: "8/14",
      value: 25000,
      plan: 22000
    }, {
      date: "8/15",
      value: 14000,
      plan: 18000
    }, {
      date: "8/16",
      value: 24000,
      plan: 22000
    }, {
      date: "8/17",
      value: 20000,
      plan: 20000
    }]
  }
};

// 采购类型数据
const procurementTypesData = {
  materials: {
    name: "材料采购",
    data: chartData.procurement
  },
  equipment: {
    name: "设备采购",
    data: [{
      date: "8/1",
      value: 18000,
      plan: 15000
    }, {
      date: "8/2",
      value: 25000,
      plan: 22000
    }, {
      date: "8/3",
      value: 20000,
      plan: 18000
    }, {
      date: "8/4",
      value: 32000,
      plan: 28000
    }, {
      date: "8/5",
      value: 28000,
      plan: 30000
    }, {
      date: "8/6",
      value: 35000,
      plan: 32000
    }, {
      date: "8/7",
      value: 22000,
      plan: 25000
    }, {
      date: "8/8",
      value: 38000,
      plan: 35000
    }, {
      date: "8/9",
      value: 30000,
      plan: 32000
    }, {
      date: "8/10",
      value: 42000,
      plan: 38000
    }, {
      date: "8/11",
      value: 32000,
      plan: 35000
    }, {
      date: "8/12",
      value: 45000,
      plan: 42000
    }, {
      date: "8/13",
      value: 35000,
      plan: 38000
    }, {
      date: "8/14",
      value: 48000,
      plan: 45000
    }, {
      date: "8/15",
      value: 32000,
      plan: 35000
    }, {
      date: "8/16",
      value: 45000,
      plan: 42000
    }, {
      date: "8/17",
      value: 38000,
      plan: 40000
    }]
  },
  subcontract: {
    name: "分包采购",
    data: [{
      date: "8/1",
      value: 22000,
      plan: 20000
    }, {
      date: "8/2",
      value: 32000,
      plan: 28000
    }, {
      date: "8/3",
      value: 25000,
      plan: 22000
    }, {
      date: "8/4",
      value: 40000,
      plan: 35000
    }, {
      date: "8/5",
      value: 35000,
      plan: 38000
    }, {
      date: "8/6",
      value: 42000,
      plan: 40000
    }, {
      date: "8/7",
      value: 28000,
      plan: 32000
    }, {
      date: "8/8",
      value: 45000,
      plan: 42000
    }, {
      date: "8/9",
      value: 38000,
      plan: 40000
    }, {
      date: "8/10",
      value: 48000,
      plan: 45000
    }, {
      date: "8/11",
      value: 40000,
      plan: 42000
    }, {
      date: "8/12",
      value: 50000,
      plan: 48000
    }, {
      date: "8/13",
      value: 42000,
      plan: 45000
    }, {
      date: "8/14",
      value: 52000,
      plan: 50000
    }, {
      date: "8/15",
      value: 38000,
      plan: 42000
    }, {
      date: "8/16",
      value: 50000,
      plan: 48000
    }, {
      date: "8/17",
      value: 45000,
      plan: 47000
    }]
  },
  orders: {
    name: "订单管理",
    data: [{
      date: "8/1",
      value: 12000,
      plan: 10000
    }, {
      date: "8/2",
      value: 18000,
      plan: 15000
    }, {
      date: "8/3",
      value: 15000,
      plan: 12000
    }, {
      date: "8/4",
      value: 22000,
      plan: 20000
    }, {
      date: "8/5",
      value: 20000,
      plan: 22000
    }, {
      date: "8/6",
      value: 25000,
      plan: 23000
    }, {
      date: "8/7",
      value: 16000,
      plan: 18000
    }, {
      date: "8/8",
      value: 28000,
      plan: 25000
    }, {
      date: "8/9",
      value: 22000,
      plan: 24000
    }, {
      date: "8/10",
      value: 30000,
      plan: 28000
    }, {
      date: "8/11",
      value: 24000,
      plan: 25000
    }, {
      date: "8/12",
      value: 32000,
      plan: 30000
    }, {
      date: "8/13",
      value: 26000,
      plan: 28000
    }, {
      date: "8/14",
      value: 35000,
      plan: 32000
    }, {
      date: "8/15",
      value: 22000,
      plan: 25000
    }, {
      date: "8/16",
      value: 32000,
      plan: 30000
    }, {
      date: "8/17",
      value: 28000,
      plan: 30000
    }]
  }
};

// 多线条图表颜色配置
const overviewColors = {
  materials: {
    concrete: "#ef4444",
    steel: "#f97316",
    blocks: "#eab308",
    mortar: "#84cc16"
  },
  labor: {
    carpenter: "#10b981",
    steelworker: "#06b6d4",
    concreter: "#8b5cf6",
    electrician: "#ec4899"
  },
  funding: {
    total: "#f59e0b",
    labor_cost: "#10b981",
    material_cost: "#ef4444",
    equipment_cost: "#8b5cf6",
    management_cost: "#06b6d4"
  },
  procurement: {
    materials: "#3b82f6",
    equipment: "#8b5cf6",
    subcontract: "#10b981",
    orders: "#f59e0b"
  }
};

// 总览模式的中文图表配置，颜色与overviewColors保持一致
const overviewChartConfigs = {
  materials: {
    concrete: {
      label: "混凝土",
      color: overviewColors.materials.concrete
    },
    steel: {
      label: "钢筋",
      color: overviewColors.materials.steel
    },
    blocks: {
      label: "空心混凝土砌块",
      color: overviewColors.materials.blocks
    },
    mortar: {
      label: "砂浆",
      color: overviewColors.materials.mortar
    }
  },
  labor: {
    carpenter: {
      label: "木工",
      color: overviewColors.labor.carpenter
    },
    steelworker: {
      label: "钢筋工",
      color: overviewColors.labor.steelworker
    },
    concreter: {
      label: "混凝土工",
      color: overviewColors.labor.concreter
    },
    electrician: {
      label: "电工",
      color: overviewColors.labor.electrician
    }
  },
  funding: {
    total: {
      label: "总资金",
      color: overviewColors.funding.total
    },
    labor_cost: {
      label: "人工费用",
      color: overviewColors.funding.labor_cost
    },
    material_cost: {
      label: "材料费用",
      color: overviewColors.funding.material_cost
    },
    equipment_cost: {
      label: "设备费用",
      color: overviewColors.funding.equipment_cost
    },
    management_cost: {
      label: "管理费用",
      color: overviewColors.funding.management_cost
    }
  },
  procurement: {
    materials: {
      label: "材料采购",
      color: overviewColors.procurement.materials
    },
    equipment: {
      label: "设备采购",
      color: overviewColors.procurement.equipment
    },
    subcontract: {
      label: "分包采购",
      color: overviewColors.procurement.subcontract
    },
    orders: {
      label: "订单管理",
      color: overviewColors.procurement.orders
    }
  }
};

// 计算统计值的辅助函数
const calculateStats = (data: Array<{
  value: number;
  plan: number;
}>, isCumulative: boolean) => {
  if (isCumulative) {
    // 累积类指标：计算总和
    const totalActual = data.reduce((sum, item) => sum + item.value, 0);
    const totalPlan = data.reduce((sum, item) => sum + item.plan, 0);
    return {
      current: totalActual,
      plan: totalPlan
    };
  } else {
    // 即时类指标：使用最新值
    const latest = data[data.length - 1];
    return {
      current: latest.value,
      plan: latest.plan
    };
  }
};

// 计算总览模式的统计值
const calculateOverviewStats = (allTypesData: any, isCumulative: boolean) => {
  if (isCumulative) {
    // 累积类指标：所有类型的总和
    let totalActual = 0;
    let totalPlan = 0;
    Object.values(allTypesData).forEach((typeData: any) => {
      totalActual += typeData.data.reduce((sum: number, item: any) => sum + item.value, 0);
      totalPlan += typeData.data.reduce((sum: number, item: any) => sum + item.plan, 0);
    });
    return {
      current: totalActual,
      plan: totalPlan
    };
  } else {
    // 即时类指标：所有类型最新值的总和
    let totalActual = 0;
    let totalPlan = 0;
    Object.values(allTypesData).forEach((typeData: any) => {
      const latest = typeData.data[typeData.data.length - 1];
      totalActual += latest.value;
      totalPlan += latest.plan;
    });
    return {
      current: totalActual,
      plan: totalPlan
    };
  }
};

export function RealTimeMonitoring() {
  const [activeChart, setActiveChart] = useState<keyof typeof chartData>("procurement");
  const [selectedMaterialType, setSelectedMaterialType] = useState<keyof typeof materialTypesData>("concrete");
  const [selectedLaborType, setSelectedLaborType] = useState<keyof typeof laborTypesData | "overview">("overview");
  const [selectedFundingType, setSelectedFundingType] = useState<keyof typeof fundingTypesData | "overview">("overview");
  const [selectedProcurementType, setSelectedProcurementType] = useState<keyof typeof procurementTypesData | "overview">("overview");
  
  const config = chartConfig[activeChart];
  const data = chartData[activeChart];
  
  return <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="tracking-tight text-xl font-medium">实时监测</h1>
        <p className="text-muted-foreground font-light">项目关键指标的实时监控与分析</p>
      </div>

      <Tabs value={activeChart} onValueChange={value => setActiveChart(value as keyof typeof chartData)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(chartConfig).map(([key, config]) => {
          const Icon = config.icon;
          return <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.title}</span>
              </TabsTrigger>;
        })}
        </TabsList>

        {Object.entries(chartData).map(([key, data]) => {
        // 根据不同标签页选择对应的数据和类型
        let displayData,
          currentTypeName,
          typeSelector,
          isOverview = false;
        const currentConfig = chartConfig[key as keyof typeof chartConfig];
        
        if (key === 'materials') {
          // 物料供应：移除总览选项，默认显示具体材料类型
          displayData = materialTypesData[selectedMaterialType].data;
          currentTypeName = materialTypesData[selectedMaterialType].name;
          const currentMaterial = materialTypesData[selectedMaterialType];
          
          typeSelector = <Select value={selectedMaterialType} onValueChange={value => setSelectedMaterialType(value as keyof typeof materialTypesData)}>
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border">
                  {Object.entries(materialTypesData).map(([typeKey, typeData]) => <SelectItem key={typeKey} value={typeKey}>
                      {typeData.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>;
              
          // 更新当前配置的单位
          currentConfig.unit = currentMaterial.unit;
        } else if (key === 'labor') {
          isOverview = selectedLaborType === 'overview';
          if (isOverview) {
            displayData = null;
            currentTypeName = '总览';
          } else {
            displayData = laborTypesData[selectedLaborType as keyof typeof laborTypesData].data;
            currentTypeName = laborTypesData[selectedLaborType as keyof typeof laborTypesData].name;
          }
          typeSelector = <Select value={selectedLaborType} onValueChange={value => setSelectedLaborType(value as keyof typeof laborTypesData | "overview")}>
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border">
                  <SelectItem value="overview">总览</SelectItem>
                  {Object.entries(laborTypesData).map(([typeKey, typeData]) => <SelectItem key={typeKey} value={typeKey}>
                      {typeData.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>;
        } else if (key === 'funding') {
          isOverview = selectedFundingType === 'overview';
          if (isOverview) {
            displayData = null;
            currentTypeName = '总览';
          } else {
            displayData = fundingTypesData[selectedFundingType as keyof typeof fundingTypesData].data;
            currentTypeName = fundingTypesData[selectedFundingType as keyof typeof fundingTypesData].name;
          }
          typeSelector = <Select value={selectedFundingType} onValueChange={value => setSelectedFundingType(value as keyof typeof fundingTypesData | "overview")}>
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border">
                  <SelectItem value="overview">总览</SelectItem>
                  {Object.entries(fundingTypesData).map(([typeKey, typeData]) => <SelectItem key={typeKey} value={typeKey}>
                      {typeData.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>;
        } else if (key === 'procurement') {
          isOverview = selectedProcurementType === 'overview';
          if (isOverview) {
            displayData = null;
            currentTypeName = '总览';
          } else {
            displayData = procurementTypesData[selectedProcurementType as keyof typeof procurementTypesData].data;
            currentTypeName = procurementTypesData[selectedProcurementType as keyof typeof procurementTypesData].name;
          }
          typeSelector = <Select value={selectedProcurementType} onValueChange={value => setSelectedProcurementType(value as keyof typeof procurementTypesData | "overview")}>
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border">
                  <SelectItem value="overview">总览</SelectItem>
                  {Object.entries(procurementTypesData).map(([typeKey, typeData]) => <SelectItem key={typeKey} value={typeKey}>
                      {typeData.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>;
        } else {
          displayData = data;
          currentTypeName = '';
          typeSelector = null;
        }

        // 计算统计值
        let stats;
        if (isOverview) {
          let allTypesData;
          if (key === 'materials') allTypesData = materialTypesData;else if (key === 'labor') allTypesData = laborTypesData;else if (key === 'funding') allTypesData = fundingTypesData;else if (key === 'procurement') allTypesData = procurementTypesData;
          stats = calculateOverviewStats(allTypesData, currentConfig.isCumulative);
        } else {
          stats = calculateStats(displayData || data, currentConfig.isCumulative);
        }

        // 动态生成图表配置 - 修复颜色一致性问题
        let chartConfigForComponent;
        if (isOverview) {
          chartConfigForComponent = overviewChartConfigs[key as keyof typeof overviewChartConfigs] || {};
        } else {
          // 根据当前选中的具体类型获取对应的颜色
          let specificColor = currentConfig.color; // 默认颜色

          if (key === 'materials') {
            specificColor = overviewColors.materials[selectedMaterialType as keyof typeof overviewColors.materials];
          } else if (key === 'labor' && selectedLaborType !== 'overview') {
            specificColor = overviewColors.labor[selectedLaborType as keyof typeof overviewColors.labor];
          } else if (key === 'funding' && selectedFundingType !== 'overview') {
            specificColor = overviewColors.funding[selectedFundingType as keyof typeof overviewColors.funding];
          } else if (key === 'procurement' && selectedProcurementType !== 'overview') {
            specificColor = overviewColors.procurement[selectedProcurementType as keyof typeof overviewColors.procurement];
          }
          chartConfigForComponent = {
            value: {
              label: "实际值",
              color: specificColor
            },
            plan: {
              label: "计划值",
              color: "#94a3b8"
            }
          };
        }
        return <TabsContent key={key} value={key} className="space-y-4">
              {/* 类型选择器 */}
              {typeSelector && <div className="flex items-center gap-4 p-0">
                  <span className="text-sm font-medium">
                    {key === 'materials' && '物料类型:'}
                    {key === 'labor' && '工种类型:'}
                    {key === 'funding' && '资金类型:'}
                    {key === 'procurement' && '采购类型:'}
                  </span>
                  {typeSelector}
                </div>}

              {/* 统计卡片 */}
              <div className="grid gap-3 md:grid-cols-3 mb-4">
                <Card className="h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 py-3">
                    <CardTitle className="text-sm font-medium">
                      {currentConfig.isCumulative ? "累计实际值" : "当前值"}
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="text-lg font-bold" style={{
                  color: currentConfig.color
                }}>
                      {stats.current.toLocaleString()}{currentConfig.unit}
                    </div>
                  </CardContent>
                </Card>
                <Card className="h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 py-3">
                    <CardTitle className="text-sm font-medium">
                      {currentConfig.isCumulative ? "累计计划值" : "计划值"}
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="text-lg font-bold text-muted-foreground">
                      {stats.plan.toLocaleString()}{currentConfig.unit}
                    </div>
                  </CardContent>
                </Card>
                <Card className="h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 py-3">
                    <CardTitle className="text-sm font-medium">完成率</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="text-lg font-bold">
                      {Math.round(stats.current / stats.plan * 100)}%
                    </div>
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
                    {currentTypeName && <span className="text-base font-normal text-muted-foreground">
                        - {currentTypeName}
                      </span>}
                  </CardTitle>
                  <CardDescription>
                    {isOverview ? `${currentConfig.title}各类型数据对比总览` : currentTypeName ? `${currentTypeName}每日${currentConfig.title.includes('配置') ? '人员数量' : currentConfig.title.includes('进度') ? '采购金额' : currentConfig.title.includes('使用') ? '资金支出' : '供应量'}监控` : currentConfig.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <ChartContainer config={chartConfigForComponent} className="h-[400px]" style={{
                  minWidth: isOverview ? "800px" : `${(displayData || data).length * 80}px`
                }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={isOverview ? key === 'materials' ? materialTypesData.concrete.data : key === 'labor' ? laborTypesData.carpenter.data : key === 'funding' ? fundingTypesData.total.data : procurementTypesData.materials.data : displayData || data} margin={{
                      top: 20,
                      right: 20,
                      left: 20,
                      bottom: isOverview ? 60 : 20
                    }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-muted-foreground" fontSize={12} interval={0} />
                          <YAxis className="text-muted-foreground" fontSize={12} tickFormatter={value => `${value}${currentConfig.unit}`} />
                          <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => [`${value}${currentConfig.unit}`, name === "value" ? "实际值" : "计划值"]} />} />
                          
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={chartConfigForComponent?.value?.color || "#ef4444"} 
                            strokeWidth={2} 
                            dot={{
                              fill: chartConfigForComponent?.value?.color || "#ef4444",
                              strokeWidth: 2,
                              r: 3
                            }} 
                            name="value" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="plan" 
                            stroke="#94a3b8" 
                            strokeWidth={2} 
                            strokeDasharray="5 5" 
                            dot={{
                              fill: "#94a3b8", 
                              strokeWidth: 2,
                              r: 3
                            }} 
                            name="plan" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>;
      })}
      </Tabs>
    </div>;
}
