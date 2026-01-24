export const planChartData = [
  { month: 10, cost: 9500 },
  { month: 12, cost: 8800 },
  { month: 14, cost: 8400 },
  { month: 16, cost: 8200 },
  { month: 18, cost: 8100 }, // 最优成本点
  { month: 20, cost: 8150 },
  { month: 22, cost: 8300 },
  { month: 24, cost: 8600 },
  { month: 26, cost: 9000 },
];

export const planOptions = [
  {
    id: 1,
    title: "施工方案1",
    endDate: "2027年3月16日",
    cost: "8450万元",
    tag: "推荐",
    tagColor: "bg-yellow-400",
    costTag: "低",
    durationTag: "早",
  },
  {
    id: 2,
    title: "施工方案2",
    endDate: "2027年3月29日",
    cost: "8327万元",
    costTag: "低",
  },
  {
    id: 3,
    title: "施工方案3",
    endDate: "2027年4月16日",
    cost: "8747万元",
  },
  {
    id: 4,
    title: "施工方案4",
    endDate: "2027年5月24日",
    cost: "9447万元",
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
