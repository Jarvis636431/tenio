export const planChartData = [
  { day: 271, cost: 6103.9 },
  { day: 274, cost: 6076.8 },
  { day: 285, cost: 6065.5 },
  { day: 290, cost: 6059.0 },
  { day: 299, cost: 6062.1 },
  { day: 346, cost: 6082.5 },
  { day: 373, cost: 6104.7 },
];

export const planOptions = [
  {
    id: 1,
    title: "施工方案1",
    totalDays: 271,
    totalCost: 61039000,
  },
  {
    id: 2,
    title: "施工方案2",
    totalDays: 274,
    totalCost: 60768000,
  },
  {
    id: 3,
    title: "施工方案3",
    totalDays: 285,
    totalCost: 60655000,
  },
  {
    id: 4,
    title: "施工方案4",
    totalDays: 290,
    totalCost: 60590000,
    tag: "推荐",
    tagColor: "bg-yellow-400",
  },
  {
    id: 5,
    title: "施工方案5",
    totalDays: 299,
    totalCost: 60621000,
  },
  {
    id: 6,
    title: "施工方案6",
    totalDays: 346,
    totalCost: 60825000,
  },
  {
    id: 7,
    title: "施工方案7",
    totalDays: 373,
    totalCost: 61047000,
  },
];

export const detailChartData = Array.from({ length: 12 }, (_, i) => ({
  month: `2026-${i + 1}`,
  value: Math.floor(Math.random() * 50) + 20 + i * 5,
  fund: Math.floor(Math.random() * 1000) + 500 + i * 100,
}));

export const processList = [
  {
    id: "P01",
    title: "主体结构标准层施工",
    details: [
      "测量放线：弹出柱、墙的位置线和水平控制线，轴线偏差需在±3mm内",
      "墙柱钢筋绑扎：连接纵向主筋，绑扎箍筋，安装保护层垫块。",
      "模板安装：搭建支架，安装墙板、梁板底模。检查模板平整度、支撑稳定性。",
    ],
  },
  {
    id: "P02",
    title: "二次结构砌筑",
    details: [
      "植筋：钻孔、清孔、注胶、植入钢筋。",
      "构造柱施工：绑扎钢筋，支模，浇筑混凝土。",
    ],
  },
  {
    id: "P03",
    title: "外墙爬架提升",
    details: ["附墙支座安装。", "架体提升。", "安全检查。"],
  },
  {
    id: "P04",
    title: "机电管线预埋",
    details: ["定位划线。", "管路敷设。", "管路固定。"],
  },
];
