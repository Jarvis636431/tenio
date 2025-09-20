import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, Download, Calendar, Filter, Edit, Eye, BarChart3 } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { GanttChart } from "@/components/GanttChart";
import { useSearchParams } from "react-router-dom";

interface PlanAndOrdersProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

// 新的施工工序数据结构 - 匹配CSV格式
interface TaskItem {
  id: number;
  task: string; // 任务名称
  specialty: string; // 所属专业
  component: string; // 构件
  workerCount: number; // 施工人数
  jobType: string; // 工种
  totalCost: number; // 总成本
  startTime: string; // 开始时间
  endTime: string; // 结束时间
  // 详情信息
  constructionSituation: string; // 施工情况
  prerequisiteProcess: string; // 前置工序
  quantity: number; // 工程量
  quantityUnit: string; // 工程量单位
  overtime: string; // 是否加班
  duration: string; // 持续时长
  actualWorkDays: number; // 实际工作天数
  constructionMethod: string; // 施工方式
  directDependency: string; // 直接依赖任务
  remarks: string; // 备注
  selectedConstructionMethod: string; // 选定施工方式
  materialCost: number; // 材料价格
  laborCost: number; // 劳动力成本
  floor: number; // 层数
}

// CSV数据 - 前20条
const csvData: TaskItem[] = [
  {
    id: 1,
    task: "1层 - 柱、墙、梁、板钢筋制作",
    specialty: "",
    component: "柱",
    workerCount: 3,
    jobType: "钢筋工",
    totalCost: 118729,
    startTime: "2025/09/01",
    endTime: "2025/09/02",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "",
    quantity: 25.61,
    quantityUnit: "吨",
    overtime: "否",
    duration: "2天9小时",
    actualWorkDays: 3,
    constructionMethod: "人工制作",
    directDependency: "无",
    remarks: "",
    selectedConstructionMethod: "人工制作",
    materialCost: 115264,
    laborCost: 3465,
    floor: 1
  },
  {
    id: 2,
    task: "1层 - 柱测量放线",
    specialty: "结构",
    component: "柱",
    workerCount: 2,
    jobType: "测量员",
    totalCost: 80,
    startTime: "2025/09/01",
    endTime: "2025/09/01",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "",
    quantity: 785.46,
    quantityUnit: "m2",
    overtime: "否",
    duration: "2小时",
    actualWorkDays: 1,
    constructionMethod: "水准仪",
    directDependency: "无",
    remarks: "",
    selectedConstructionMethod: "水准仪",
    materialCost: 0,
    laborCost: 80,
    floor: 1
  },
  {
    id: 3,
    task: "1层 - 剪力墙放线",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 2,
    jobType: "测量员",
    totalCost: 80,
    startTime: "2025/09/01",
    endTime: "2025/09/01",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "",
    quantity: 785.46,
    quantityUnit: "m2",
    overtime: "否",
    duration: "2小时",
    actualWorkDays: 1,
    constructionMethod: "水准仪",
    directDependency: "无",
    remarks: "",
    selectedConstructionMethod: "水准仪",
    materialCost: 0,
    laborCost: 80,
    floor: 1
  },
  {
    id: 4,
    task: "1层 - 柱钢筋绑扎",
    specialty: "结构",
    component: "柱",
    workerCount: 8,
    jobType: "钢筋工",
    totalCost: 0,
    startTime: "2025/09/02",
    endTime: "2025/09/02",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2",
    quantity: 0,
    quantityUnit: "吨",
    overtime: "否",
    duration: "0小时",
    actualWorkDays: 0,
    constructionMethod: "人工",
    directDependency: "柱、墙、梁、板钢筋制作, 柱测量放线",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 1
  },
  {
    id: 5,
    task: "1层 - 短肢剪力墙钢筋绑扎",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 8,
    jobType: "钢筋工",
    totalCost: 3360,
    startTime: "2025/09/02",
    endTime: "2025/09/03",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 3",
    quantity: 8.28,
    quantityUnit: "吨",
    overtime: "否",
    duration: "1天",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "柱、墙、梁、板钢筋制作, 剪力墙放线",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 3360,
    floor: 1
  },
  {
    id: 6,
    task: "1层 - 柱钢筋验收",
    specialty: "",
    component: "柱",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/09/02",
    endTime: "2025/09/03",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2, 4",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "柱钢筋绑扎",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 1
  },
  {
    id: 7,
    task: "1层 - 剪力墙钢筋验收",
    specialty: "",
    component: "剪力墙",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/09/03",
    endTime: "2025/09/03",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2, 5",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "柱测量放线, 短肢剪力墙钢筋绑扎",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 1
  },
  {
    id: 8,
    task: "1层 - 柱模板拼装",
    specialty: "结构",
    component: "柱",
    workerCount: 4,
    jobType: "木工",
    totalCost: 0,
    startTime: "2025/09/03",
    endTime: "2025/09/03",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2, 4, 6",
    quantity: 0,
    quantityUnit: "m2",
    overtime: "否",
    duration: "0小时",
    actualWorkDays: 0,
    constructionMethod: "木模板, 铝模板, 塑料模板, 大模板",
    directDependency: "柱钢筋验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "木模板",
    materialCost: 0,
    laborCost: 0,
    floor: 1
  },
  {
    id: 9,
    task: "1层 - 剪力墙模板拼装",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 4,
    jobType: "木工",
    totalCost: 14994,
    startTime: "2025/09/03",
    endTime: "2025/09/04",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 3, 5, 7",
    quantity: 951.66,
    quantityUnit: "m2",
    overtime: "否",
    duration: "1天8小时",
    actualWorkDays: 2,
    constructionMethod: "木模板, 铝模板, 塑料模板, 大模板",
    directDependency: "剪力墙钢筋验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "木模板",
    materialCost: 11394,
    laborCost: 3600,
    floor: 1
  },
  {
    id: 10,
    task: "1层 - 墙模板验收",
    specialty: "",
    component: "板",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/09/04",
    endTime: "2025/09/05",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 3, 5, 7, 9",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "剪力墙模板拼装",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 1
  },
  {
    id: 11,
    task: "1层 - 柱模板验收",
    specialty: "",
    component: "柱",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/09/03",
    endTime: "2025/09/03",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2, 4, 6, 8",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "柱模板拼装",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 1
  },
  {
    id: 12,
    task: "1层 - 短肢剪力墙混凝土浇筑",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 8,
    jobType: "混凝土工",
    totalCost: 38430.73,
    startTime: "2025/09/07",
    endTime: "2025/09/07",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 3, 5, 7, 9, 10",
    quantity: 92.62,
    quantityUnit: "m3",
    overtime: "否",
    duration: "5小时",
    actualWorkDays: 1,
    constructionMethod: "固定泵1个, 固定泵2个, 移动泵1个, 移动泵2个",
    directDependency: "墙模板验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "固定泵1个",
    materialCost: 37390.7342,
    laborCost: 1040,
    floor: 1
  },
  {
    id: 13,
    task: "1层 - 短肢剪力墙混凝土养护",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 2,
    jobType: "不限",
    totalCost: 2688,
    startTime: "2025/09/07",
    endTime: "2025/09/12",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 3, 5, 7, 9, 10, 12",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "7天",
    actualWorkDays: 7,
    constructionMethod: "人工",
    directDependency: "短肢剪力墙混凝土浇筑",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 2688,
    floor: 1
  },
  {
    id: 14,
    task: "1层 - 柱混凝土浇筑",
    specialty: "结构",
    component: "柱",
    workerCount: 4,
    jobType: "混凝土工",
    totalCost: 0,
    startTime: "2025/09/07",
    endTime: "2025/09/07",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2, 4, 6, 8, 11",
    quantity: 0,
    quantityUnit: "m3",
    overtime: "否",
    duration: "0小时",
    actualWorkDays: 0,
    constructionMethod: "固定泵1个, 固定泵2个, 移动泵1个, 移动泵2个",
    directDependency: "柱模板验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "固定泵1个",
    materialCost: 0,
    laborCost: 0,
    floor: 1
  },
  {
    id: 15,
    task: "1层 - 柱混凝土养护",
    specialty: "结构",
    component: "柱",
    workerCount: 2,
    jobType: "不限",
    totalCost: 2688,
    startTime: "2025/09/07",
    endTime: "2025/09/11",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2, 4, 6, 8, 11, 14",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "7天",
    actualWorkDays: 7,
    constructionMethod: "人工",
    directDependency: "柱混凝土浇筑",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 2688,
    floor: 1
  },
  {
    id: 16,
    task: "1层 - 短肢剪力墙模板拆除",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 4,
    jobType: "木工",
    totalCost: 1800,
    startTime: "2025/09/12",
    endTime: "2025/09/12",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 3, 5, 7, 9, 10, 12, 13",
    quantity: 951.66,
    quantityUnit: "m2",
    overtime: "否",
    duration: "10小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "短肢剪力墙混凝土养护",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 1800,
    floor: 1
  },
  {
    id: 17,
    task: "1层 - 柱模板拆除",
    specialty: "结构",
    component: "柱",
    workerCount: 4,
    jobType: "木工",
    totalCost: 0,
    startTime: "2025/09/11",
    endTime: "2025/09/11",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2, 4, 6, 8, 11, 14, 15",
    quantity: 0,
    quantityUnit: "m2",
    overtime: "否",
    duration: "0小时",
    actualWorkDays: 0,
    constructionMethod: "人工",
    directDependency: "柱混凝土养护",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 1
  },
  {
    id: 18,
    task: "1层 - 预制叠合板安装",
    specialty: "结构",
    component: "板",
    workerCount: 3,
    jobType: "不限",
    totalCost: 12981.55,
    startTime: "2025/09/12",
    endTime: "2025/09/13",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17",
    quantity: 785.46,
    quantityUnit: "m2",
    overtime: "否",
    duration: "1天",
    actualWorkDays: 1,
    constructionMethod: "人工＋机械",
    directDependency: "短肢剪力墙模板拆除, 柱模板拆除",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工＋机械",
    materialCost: 12405.546,
    laborCost: 576,
    floor: 1
  },
  {
    id: 19,
    task: "1层 - 钢筋桁架楼承板安装",
    specialty: "结构",
    component: "板",
    workerCount: 3,
    jobType: "木工",
    totalCost: 1620,
    startTime: "2025/09/12",
    endTime: "2025/09/13",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17",
    quantity: 785.46,
    quantityUnit: "m2",
    overtime: "否",
    duration: "1天",
    actualWorkDays: 1,
    constructionMethod: "人工＋机械",
    directDependency: "短肢剪力墙模板拆除, 柱模板拆除",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工＋机械",
    materialCost: 0,
    laborCost: 1620,
    floor: 1
  },
  {
    id: 20,
    task: "1层 - 梁板模板拼装",
    specialty: "结构",
    component: "板",
    workerCount: 4,
    jobType: "木工",
    totalCost: 56577.68,
    startTime: "2025/09/12",
    endTime: "2025/09/14",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17",
    quantity: 898.8,
    quantityUnit: "m2",
    overtime: "否",
    duration: "1天2小时",
    actualWorkDays: 2,
    constructionMethod: "木模板, 铝模板, 塑料模板, 大模板",
    directDependency: "短肢剪力墙模板拆除, 柱模板拆除",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "木模板",
    materialCost: 54057.6773,
    laborCost: 2520,
    floor: 1
  },
  {
    id: 21,
    task: "1层 - 梁板钢筋绑扎",
    specialty: "结构",
    component: "板",
    workerCount: 6,
    jobType: "钢筋工",
    totalCost: 12500,
    startTime: "2025/09/14",
    endTime: "2025/09/15",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "18, 19, 20",
    quantity: 12.5,
    quantityUnit: "吨",
    overtime: "否",
    duration: "1天",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "预制叠合板安装, 钢筋桁架楼承板安装, 梁板模板拼装",
    remarks: "依赖3个任务",
    selectedConstructionMethod: "人工",
    materialCost: 10000,
    laborCost: 2500,
    floor: 1
  },
  {
    id: 22,
    task: "1层 - 梁板钢筋验收",
    specialty: "",
    component: "板",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/09/15",
    endTime: "2025/09/15",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "21",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "梁板钢筋绑扎",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 1
  },
  {
    id: 23,
    task: "1层 - 梁板混凝土浇筑",
    specialty: "结构",
    component: "板",
    workerCount: 8,
    jobType: "混凝土工",
    totalCost: 45200,
    startTime: "2025/09/16",
    endTime: "2025/09/16",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "21, 22",
    quantity: 108.5,
    quantityUnit: "m3",
    overtime: "否",
    duration: "6小时",
    actualWorkDays: 1,
    constructionMethod: "固定泵1个",
    directDependency: "梁板钢筋验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "固定泵1个",
    materialCost: 44000,
    laborCost: 1200,
    floor: 1
  },
  {
    id: 24,
    task: "1层 - 梁板混凝土养护",
    specialty: "结构",
    component: "板",
    workerCount: 2,
    jobType: "不限",
    totalCost: 2400,
    startTime: "2025/09/16",
    endTime: "2025/09/21",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "23",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "7天",
    actualWorkDays: 7,
    constructionMethod: "人工",
    directDependency: "梁板混凝土浇筑",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 2400,
    floor: 1
  },
  {
    id: 25,
    task: "1层 - 梁板模板拆除",
    specialty: "结构",
    component: "板",
    workerCount: 4,
    jobType: "木工",
    totalCost: 3200,
    startTime: "2025/09/21",
    endTime: "2025/09/21",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "23, 24",
    quantity: 898.8,
    quantityUnit: "m2",
    overtime: "否",
    duration: "8小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "梁板混凝土养护",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 3200,
    floor: 1
  },
  {
    id: 26,
    task: "2层 - 柱、墙、梁、板钢筋制作",
    specialty: "结构",
    component: "柱",
    workerCount: 3,
    jobType: "钢筋工",
    totalCost: 118729,
    startTime: "2025/09/22",
    endTime: "2025/09/23",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "25",
    quantity: 25.61,
    quantityUnit: "吨",
    overtime: "否",
    duration: "2天9小时",
    actualWorkDays: 3,
    constructionMethod: "人工制作",
    directDependency: "梁板模板拆除",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工制作",
    materialCost: 115264,
    laborCost: 3465,
    floor: 2
  },
  {
    id: 27,
    task: "2层 - 柱测量放线",
    specialty: "结构",
    component: "柱",
    workerCount: 2,
    jobType: "测量员",
    totalCost: 80,
    startTime: "2025/09/22",
    endTime: "2025/09/22",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "25",
    quantity: 785.46,
    quantityUnit: "m2",
    overtime: "否",
    duration: "2小时",
    actualWorkDays: 1,
    constructionMethod: "水准仪",
    directDependency: "梁板模板拆除",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "水准仪",
    materialCost: 0,
    laborCost: 80,
    floor: 2
  },
  {
    id: 28,
    task: "2层 - 剪力墙放线",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 2,
    jobType: "测量员",
    totalCost: 80,
    startTime: "2025/09/22",
    endTime: "2025/09/22",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "25",
    quantity: 785.46,
    quantityUnit: "m2",
    overtime: "否",
    duration: "2小时",
    actualWorkDays: 1,
    constructionMethod: "水准仪",
    directDependency: "梁板模板拆除",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "水准仪",
    materialCost: 0,
    laborCost: 80,
    floor: 2
  },
  {
    id: 29,
    task: "2层 - 柱钢筋绑扎",
    specialty: "结构",
    component: "柱",
    workerCount: 8,
    jobType: "钢筋工",
    totalCost: 0,
    startTime: "2025/09/23",
    endTime: "2025/09/23",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 27",
    quantity: 0,
    quantityUnit: "吨",
    overtime: "否",
    duration: "0小时",
    actualWorkDays: 0,
    constructionMethod: "人工",
    directDependency: "柱、墙、梁、板钢筋制作, 柱测量放线",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 2
  },
  {
    id: 30,
    task: "2层 - 短肢剪力墙钢筋绑扎",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 8,
    jobType: "钢筋工",
    totalCost: 3360,
    startTime: "2025/09/23",
    endTime: "2025/09/24",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 28",
    quantity: 8.28,
    quantityUnit: "吨",
    overtime: "否",
    duration: "1天",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "柱、墙、梁、板钢筋制作, 剪力墙放线",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 3360,
    floor: 2
  },
  {
    id: 31,
    task: "2层 - 柱钢筋验收",
    specialty: "",
    component: "柱",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/09/23",
    endTime: "2025/09/24",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 27, 29",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "柱钢筋绑扎",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 2
  },
  {
    id: 32,
    task: "2层 - 剪力墙钢筋验收",
    specialty: "",
    component: "剪力墙",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/09/24",
    endTime: "2025/09/24",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 28, 30",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "短肢剪力墙钢筋绑扎",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 2
  },
  {
    id: 33,
    task: "2层 - 柱模板拼装",
    specialty: "结构",
    component: "柱",
    workerCount: 4,
    jobType: "木工",
    totalCost: 0,
    startTime: "2025/09/24",
    endTime: "2025/09/24",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 27, 29, 31",
    quantity: 0,
    quantityUnit: "m2",
    overtime: "否",
    duration: "0小时",
    actualWorkDays: 0,
    constructionMethod: "木模板, 铝模板, 塑料模板, 大模板",
    directDependency: "柱钢筋验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "木模板",
    materialCost: 0,
    laborCost: 0,
    floor: 2
  },
  {
    id: 34,
    task: "2层 - 剪力墙模板拼装",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 4,
    jobType: "木工",
    totalCost: 14994,
    startTime: "2025/09/24",
    endTime: "2025/09/25",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 28, 30, 32",
    quantity: 951.66,
    quantityUnit: "m2",
    overtime: "否",
    duration: "1天8小时",
    actualWorkDays: 2,
    constructionMethod: "木模板, 铝模板, 塑料模板, 大模板",
    directDependency: "剪力墙钢筋验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "木模板",
    materialCost: 11394,
    laborCost: 3600,
    floor: 2
  },
  {
    id: 35,
    task: "2层 - 墙模板验收",
    specialty: "",
    component: "板",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/09/25",
    endTime: "2025/09/26",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 28, 30, 32, 34",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "剪力墙模板拼装",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 2
  },
  {
    id: 36,
    task: "2层 - 柱模板验收",
    specialty: "",
    component: "柱",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/09/24",
    endTime: "2025/09/24",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 27, 29, 31, 33",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "柱模板拼装",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 2
  },
  {
    id: 37,
    task: "2层 - 短肢剪力墙混凝土浇筑",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 8,
    jobType: "混凝土工",
    totalCost: 38430.73,
    startTime: "2025/09/28",
    endTime: "2025/09/28",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 28, 30, 32, 34, 35",
    quantity: 92.62,
    quantityUnit: "m3",
    overtime: "否",
    duration: "5小时",
    actualWorkDays: 1,
    constructionMethod: "固定泵1个, 固定泵2个, 移动泵1个, 移动泵2个",
    directDependency: "墙模板验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "固定泵1个",
    materialCost: 37390.7342,
    laborCost: 1040,
    floor: 2
  },
  {
    id: 38,
    task: "2层 - 短肢剪力墙混凝土养护",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 2,
    jobType: "不限",
    totalCost: 2688,
    startTime: "2025/09/28",
    endTime: "2025/10/03",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 28, 30, 32, 34, 35, 37",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "7天",
    actualWorkDays: 7,
    constructionMethod: "人工",
    directDependency: "短肢剪力墙混凝土浇筑",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 2688,
    floor: 2
  },
  {
    id: 39,
    task: "2层 - 柱混凝土浇筑",
    specialty: "结构",
    component: "柱",
    workerCount: 4,
    jobType: "混凝土工",
    totalCost: 0,
    startTime: "2025/09/28",
    endTime: "2025/09/28",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 27, 29, 31, 33, 36",
    quantity: 0,
    quantityUnit: "m3",
    overtime: "否",
    duration: "0小时",
    actualWorkDays: 0,
    constructionMethod: "固定泵1个, 固定泵2个, 移动泵1个, 移动泵2个",
    directDependency: "柱模板验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "固定泵1个",
    materialCost: 0,
    laborCost: 0,
    floor: 2
  },
  {
    id: 40,
    task: "2层 - 柱混凝土养护",
    specialty: "结构",
    component: "柱",
    workerCount: 2,
    jobType: "不限",
    totalCost: 2688,
    startTime: "2025/09/28",
    endTime: "2025/10/02",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 27, 29, 31, 33, 36, 39",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "7天",
    actualWorkDays: 7,
    constructionMethod: "人工",
    directDependency: "柱混凝土浇筑",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 2688,
    floor: 2
  },
  {
    id: 41,
    task: "2层 - 短肢剪力墙模板拆除",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 4,
    jobType: "木工",
    totalCost: 1800,
    startTime: "2025/10/03",
    endTime: "2025/10/03",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 28, 30, 32, 34, 35, 37, 38",
    quantity: 951.66,
    quantityUnit: "m2",
    overtime: "否",
    duration: "10小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "短肢剪力墙混凝土养护",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 1800,
    floor: 2
  },
  {
    id: 42,
    task: "2层 - 柱模板拆除",
    specialty: "结构",
    component: "柱",
    workerCount: 4,
    jobType: "木工",
    totalCost: 0,
    startTime: "2025/10/02",
    endTime: "2025/10/02",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 27, 29, 31, 33, 36, 39, 40",
    quantity: 0,
    quantityUnit: "m2",
    overtime: "否",
    duration: "0小时",
    actualWorkDays: 0,
    constructionMethod: "人工",
    directDependency: "柱混凝土养护",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 2
  },
  {
    id: 43,
    task: "2层 - 预制叠合板安装",
    specialty: "结构",
    component: "板",
    workerCount: 3,
    jobType: "不限",
    totalCost: 12981.55,
    startTime: "2025/10/03",
    endTime: "2025/10/04",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42",
    quantity: 785.46,
    quantityUnit: "m2",
    overtime: "否",
    duration: "1天",
    actualWorkDays: 1,
    constructionMethod: "人工＋机械",
    directDependency: "短肢剪力墙模板拆除, 柱模板拆除",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工＋机械",
    materialCost: 12405.546,
    laborCost: 576,
    floor: 2
  },
  {
    id: 44,
    task: "2层 - 钢筋桁架楼承板安装",
    specialty: "结构",
    component: "板",
    workerCount: 3,
    jobType: "木工",
    totalCost: 1620,
    startTime: "2025/10/03",
    endTime: "2025/10/04",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42",
    quantity: 785.46,
    quantityUnit: "m2",
    overtime: "否",
    duration: "1天",
    actualWorkDays: 1,
    constructionMethod: "人工＋机械",
    directDependency: "短肢剪力墙模板拆除, 柱模板拆除",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工＋机械",
    materialCost: 0,
    laborCost: 1620,
    floor: 2
  },
  {
    id: 45,
    task: "2层 - 梁板模板拼装",
    specialty: "结构",
    component: "板",
    workerCount: 4,
    jobType: "木工",
    totalCost: 56577.68,
    startTime: "2025/10/03",
    endTime: "2025/10/05",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42",
    quantity: 898.8,
    quantityUnit: "m2",
    overtime: "否",
    duration: "1天2小时",
    actualWorkDays: 2,
    constructionMethod: "木模板, 铝模板, 塑料模板, 大模板",
    directDependency: "短肢剪力墙模板拆除, 柱模板拆除",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "木模板",
    materialCost: 54057.6773,
    laborCost: 2520,
    floor: 2
  },
  {
    id: 46,
    task: "2层 - 梁板钢筋绑扎",
    specialty: "结构",
    component: "板",
    workerCount: 6,
    jobType: "钢筋工",
    totalCost: 12500,
    startTime: "2025/10/05",
    endTime: "2025/10/06",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "43, 44, 45",
    quantity: 12.5,
    quantityUnit: "吨",
    overtime: "否",
    duration: "1天",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "预制叠合板安装, 钢筋桁架楼承板安装, 梁板模板拼装",
    remarks: "依赖3个任务",
    selectedConstructionMethod: "人工",
    materialCost: 10000,
    laborCost: 2500,
    floor: 2
  },
  {
    id: 47,
    task: "2层 - 梁板钢筋验收",
    specialty: "",
    component: "板",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/10/06",
    endTime: "2025/10/06",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "46",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "梁板钢筋绑扎",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 2
  },
  {
    id: 48,
    task: "2层 - 梁板混凝土浇筑",
    specialty: "结构",
    component: "板",
    workerCount: 8,
    jobType: "混凝土工",
    totalCost: 45200,
    startTime: "2025/10/07",
    endTime: "2025/10/07",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "46, 47",
    quantity: 108.5,
    quantityUnit: "m3",
    overtime: "否",
    duration: "6小时",
    actualWorkDays: 1,
    constructionMethod: "固定泵1个",
    directDependency: "梁板钢筋验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "固定泵1个",
    materialCost: 44000,
    laborCost: 1200,
    floor: 2
  },
  {
    id: 49,
    task: "2层 - 梁板混凝土养护",
    specialty: "结构",
    component: "板",
    workerCount: 2,
    jobType: "不限",
    totalCost: 2400,
    startTime: "2025/10/07",
    endTime: "2025/10/12",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "48",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "7天",
    actualWorkDays: 7,
    constructionMethod: "人工",
    directDependency: "梁板混凝土浇筑",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 2400,
    floor: 2
  },
  {
    id: 50,
    task: "2层 - 梁板模板拆除",
    specialty: "结构",
    component: "板",
    workerCount: 4,
    jobType: "木工",
    totalCost: 3200,
    startTime: "2025/10/12",
    endTime: "2025/10/12",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "48, 49",
    quantity: 898.8,
    quantityUnit: "m2",
    overtime: "否",
    duration: "8小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "梁板混凝土养护",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 3200,
    floor: 2
  },
  {
    id: 51,
    task: "3层 - 柱、墙、梁、板钢筋制作",
    specialty: "结构",
    component: "柱",
    workerCount: 3,
    jobType: "钢筋工",
    totalCost: 118729,
    startTime: "2025/10/13",
    endTime: "2025/10/14",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "50",
    quantity: 25.61,
    quantityUnit: "吨",
    overtime: "否",
    duration: "2天9小时",
    actualWorkDays: 3,
    constructionMethod: "人工制作",
    directDependency: "梁板模板拆除",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工制作",
    materialCost: 115264,
    laborCost: 3465,
    floor: 3
  },
  {
    id: 52,
    task: "3层 - 柱测量放线",
    specialty: "结构",
    component: "柱",
    workerCount: 2,
    jobType: "测量员",
    totalCost: 80,
    startTime: "2025/10/13",
    endTime: "2025/10/13",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "50",
    quantity: 785.46,
    quantityUnit: "m2",
    overtime: "否",
    duration: "2小时",
    actualWorkDays: 1,
    constructionMethod: "水准仪",
    directDependency: "梁板模板拆除",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "水准仪",
    materialCost: 0,
    laborCost: 80,
    floor: 3
  },
  {
    id: 53,
    task: "3层 - 剪力墙放线",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 2,
    jobType: "测量员",
    totalCost: 80,
    startTime: "2025/10/13",
    endTime: "2025/10/13",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "50",
    quantity: 785.46,
    quantityUnit: "m2",
    overtime: "否",
    duration: "2小时",
    actualWorkDays: 1,
    constructionMethod: "水准仪",
    directDependency: "梁板模板拆除",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "水准仪",
    materialCost: 0,
    laborCost: 80,
    floor: 3
  },
  {
    id: 54,
    task: "3层 - 柱钢筋绑扎",
    specialty: "结构",
    component: "柱",
    workerCount: 8,
    jobType: "钢筋工",
    totalCost: 0,
    startTime: "2025/10/14",
    endTime: "2025/10/14",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "51, 52",
    quantity: 0,
    quantityUnit: "吨",
    overtime: "否",
    duration: "0小时",
    actualWorkDays: 0,
    constructionMethod: "人工",
    directDependency: "柱、墙、梁、板钢筋制作, 柱测量放线",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 3
  },
  {
    id: 55,
    task: "3层 - 短肢剪力墙钢筋绑扎",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 8,
    jobType: "钢筋工",
    totalCost: 3360,
    startTime: "2025/10/14",
    endTime: "2025/10/15",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "51, 53",
    quantity: 8.28,
    quantityUnit: "吨",
    overtime: "否",
    duration: "1天",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "柱、墙、梁、板钢筋制作, 剪力墙放线",
    remarks: "依赖2个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 3360,
    floor: 3
  },
  {
    id: 56,
    task: "3层 - 柱钢筋验收",
    specialty: "",
    component: "柱",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/10/14",
    endTime: "2025/10/15",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "51, 52, 54",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "柱钢筋绑扎",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 3
  },
  {
    id: 57,
    task: "3层 - 剪力墙钢筋验收",
    specialty: "",
    component: "剪力墙",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/10/15",
    endTime: "2025/10/15",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "51, 53, 55",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "短肢剪力墙钢筋绑扎",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 3
  },
  {
    id: 58,
    task: "3层 - 柱模板拼装",
    specialty: "结构",
    component: "柱",
    workerCount: 4,
    jobType: "木工",
    totalCost: 0,
    startTime: "2025/10/15",
    endTime: "2025/10/15",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "51, 52, 54, 56",
    quantity: 0,
    quantityUnit: "m2",
    overtime: "否",
    duration: "0小时",
    actualWorkDays: 0,
    constructionMethod: "木模板, 铝模板, 塑料模板, 大模板",
    directDependency: "柱钢筋验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "木模板",
    materialCost: 0,
    laborCost: 0,
    floor: 3
  },
  {
    id: 59,
    task: "3层 - 剪力墙模板拼装",
    specialty: "结构",
    component: "剪力墙",
    workerCount: 4,
    jobType: "木工",
    totalCost: 14994,
    startTime: "2025/10/15",
    endTime: "2025/10/16",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "51, 53, 55, 57",
    quantity: 951.66,
    quantityUnit: "m2",
    overtime: "否",
    duration: "1天8小时",
    actualWorkDays: 2,
    constructionMethod: "木模板, 铝模板, 塑料模板, 大模板",
    directDependency: "剪力墙钢筋验收",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "木模板",
    materialCost: 11394,
    laborCost: 3600,
    floor: 3
  },
  {
    id: 60,
    task: "3层 - 墙模板验收",
    specialty: "",
    component: "板",
    workerCount: 0,
    jobType: "",
    totalCost: 0,
    startTime: "2025/10/16",
    endTime: "2025/10/17",
    constructionSituation: "标准层施工, 暑期施工",
    prerequisiteProcess: "51, 53, 55, 57, 59",
    quantity: 0,
    quantityUnit: "",
    overtime: "否",
    duration: "4小时",
    actualWorkDays: 1,
    constructionMethod: "人工",
    directDependency: "剪力墙模板拼装",
    remarks: "依赖1个任务",
    selectedConstructionMethod: "人工",
    materialCost: 0,
    laborCost: 0,
    floor: 3
  }
];

// 南山区幼儿园项目数据（保留原有数据作为备用）
const kindergartenData: TaskItem[] = [
  {
    id: 1,
    task: "基础开挖",
    specialty: "建筑",
    component: "基础",
    workerCount: 6,
    jobType: "土方工",
    totalCost: 19400,
    startTime: "2025/01/01",
    endTime: "2025/01/08",
    constructionSituation: "标准层施工",
    prerequisiteProcess: "",
    quantity: 800,
    quantityUnit: "m³",
    overtime: "否",
    duration: "8天",
    actualWorkDays: 8,
    constructionMethod: "机械开挖",
    directDependency: "无",
    remarks: "",
    selectedConstructionMethod: "机械开挖",
    materialCost: 5000,
    laborCost: 14400,
    floor: 0
  }
];

export function PlanAndOrders({ showExpandButton = false, onExpandSidebar }: PlanAndOrdersProps) {
  const { currentProject } = useProject();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"task" | "duration" | "workerCount" | "totalCost">("task");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // 根据URL参数确定显示的内容
  const activeView = searchParams.get('tab') || 'task-overview';

  // 根据当前项目选择数据
  const allData = useMemo(() => {
    // 始终使用CSV数据，除非明确指定使用幼儿园数据
    return csvData;
  }, []);

  // 工种类型
  const jobTypes = useMemo(() => {
    const types = new Set(allData.map(item => item.jobType).filter(Boolean));
    return Array.from(types);
  }, [allData]);

  // 楼层类型
  const floorTypes = useMemo(() => {
    const floors = new Set(allData.map(item => item.floor));
    return Array.from(floors).sort((a, b) => a - b);
  }, [allData]);

  // 过滤和排序数据
  const filteredData = useMemo(() => {
    let filtered = allData.filter(item => {
      const matchesSearch = item.task.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesJob = jobFilter === "all" || item.jobType === jobFilter;
      const matchesFloor = floorFilter === "all" || item.floor.toString() === floorFilter;
      return matchesSearch && matchesJob && matchesFloor;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "task":
          aValue = a.task;
          bValue = b.task;
          break;
        case "duration":
          aValue = a.actualWorkDays;
          bValue = b.actualWorkDays;
          break;
        case "workerCount":
          aValue = a.workerCount;
          bValue = b.workerCount;
          break;
        case "totalCost":
          aValue = a.totalCost;
          bValue = b.totalCost;
          break;
        default:
          aValue = a.task;
          bValue = b.task;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [allData, searchTerm, jobFilter, floorFilter, sortBy, sortOrder]);

  // 分页数据
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 工种颜色映射
  const getJobTypeColor = (jobType: string) => {
    const colors: { [key: string]: string } = {
      "钢筋工": "bg-blue-100 text-blue-800",
      "混凝土工": "bg-green-100 text-green-800",
      "木工": "bg-yellow-100 text-yellow-800",
      "测量员": "bg-purple-100 text-purple-800",
      "土方工": "bg-orange-100 text-orange-800",
      "砌筑工": "bg-pink-100 text-pink-800",
      "抹灰工": "bg-indigo-100 text-indigo-800",
      "防水工": "bg-cyan-100 text-cyan-800",
      "水电工": "bg-teal-100 text-teal-800",
      "油漆工": "bg-lime-100 text-lime-800",
      "油工": "bg-lime-100 text-lime-800",
      "瓦工": "bg-pink-100 text-pink-800",
      "不限": "bg-gray-100 text-gray-800"
    };
    return colors[jobType] || "bg-gray-100 text-gray-800";
  };

  // 详情对话框处理
  const handleDetailClick = (item: TaskItem) => {
    setSelectedItem(item);
    setIsDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDialogOpen(false);
    setSelectedItem(null);
  };

  // 甘特图数据转换 - 使用过滤后的数据
  const ganttData = useMemo(() => {
    return filteredData.map(item => ({
      id: item.id,
      task: item.task,
      startDate: item.startTime,
      endDate: item.endTime,
      duration: item.duration,
      worker: item.jobType,
      count: item.workerCount,
      floor: item.floor
    }));
  }, [filteredData]);

  // 重置分页当搜索条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, jobFilter, floorFilter, sortBy, sortOrder]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索任务..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择工种" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部工种</SelectItem>
              {jobTypes.map(jobType => (
                <SelectItem key={jobType} value={jobType}>{jobType}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={floorFilter} onValueChange={setFloorFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择楼层" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部楼层</SelectItem>
              {floorTypes.map(floor => (
                <SelectItem key={floor} value={floor.toString()}>
                  {floor === 0 ? "基础层" : `${floor}层`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            {activeView === 'gantt-chart' ? `显示 ${ganttData.length} 个任务` : `显示 ${filteredData.length} 个任务`}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              新增任务
            </Button>
          </div>
        </div>
      </div>

      <div className="h-full flex flex-col">
        {/* 可滚动的内容区域 - 自适应高度 */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'task-overview' && (
            <div className="h-full flex flex-col space-y-6">
              {/* 数据表格 */}
              <div className="flex-1 flex flex-col">
                {/* 表格容器 - 带边框 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-[calc(100vh-350px)] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-30 shadow-sm">
                        <TableRow>
                          <TableHead className="w-[234px] border-r bg-white">
                            任务
                          </TableHead>
                          <TableHead className="w-[120px] bg-white">所属专业</TableHead>
                          <TableHead className="w-[120px] bg-white">构件</TableHead>
                          <TableHead className="w-[100px] bg-white">人数</TableHead>
                          <TableHead className="w-[120px] bg-white">工种</TableHead>
                          <TableHead className="w-[120px] bg-white">总成本</TableHead>
                          <TableHead className="w-[120px] bg-white">开始时间</TableHead>
                          <TableHead className="w-[120px] bg-white">结束时间</TableHead>
                          <TableHead className="w-[216px] border-l bg-white">
                            操作
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map(item => (
                          <TableRow key={item.id} className="hover:bg-gray-50 border-b h-12">
                            <TableCell className="sticky left-0 z-20 w-[234px] border-r bg-white hover:bg-gray-50 py-2">
                              <div className="text-sm">{item.task}</div>
                            </TableCell>
                            <TableCell className="w-[120px] bg-white hover:bg-gray-50 py-2">
                              {item.specialty && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {item.specialty}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="w-[120px] bg-white hover:bg-gray-50 py-2">{item.component}</TableCell>
                            <TableCell className="w-[100px] bg-white hover:bg-gray-50 py-2">{item.workerCount}</TableCell>
                            <TableCell className="w-[120px] bg-white hover:bg-gray-50 py-2">
                              {item.jobType && (
                                <Badge variant="secondary" className={getJobTypeColor(item.jobType)}>
                                  {item.jobType}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="w-[120px] bg-white hover:bg-gray-50 py-2">¥{item.totalCost.toLocaleString()}</TableCell>
                            <TableCell className="w-[120px] bg-white hover:bg-gray-50 py-2">{item.startTime}</TableCell>
                            <TableCell className="w-[120px] bg-white hover:bg-gray-50 py-2">{item.endTime}</TableCell>
                            <TableCell className="sticky right-0 z-20 w-[216px] border-l bg-white hover:bg-gray-50 py-2">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                                  <Edit className="h-4 w-4 mr-1" />
                                  编辑
                                </Button>
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleDetailClick(item)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  详情
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* 分页控件 - 在边框外面 */}
                <div className="flex items-center justify-between p-4 mt-4">
                  <div className="text-sm text-muted-foreground">
                    显示 {((currentPage - 1) * itemsPerPage) + 1} 到 {Math.min(currentPage * itemsPerPage, filteredData.length)} 条，共 {filteredData.length} 条记录
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {currentPage} 页，共 {totalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'gantt-chart' && (
            <div className="h-full">
              <GanttChart data={ganttData} />
            </div>
          )}
        </div>
      </div>

      {/* 详情抽屉 */}
      <Sheet open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px]" showOverlay={false}>
          <SheetHeader>
            <SheetTitle>
              任务详情 - {selectedItem?.task}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto flex-1">
          {selectedItem && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">任务名称</label>
                      <p className="text-sm">{selectedItem.task}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">所属专业</label>
                      <p className="text-sm">{selectedItem.specialty || "无"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">施工方式</label>
                      <p className="text-sm">{selectedItem.constructionMethod}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">构件</label>
                      <p className="text-sm">{selectedItem.component}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">工种</label>
                      <p className="text-sm">{selectedItem.jobType || "无"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">施工人数</label>
                      <p className="text-sm">{selectedItem.workerCount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">开始时间</label>
                      <p className="text-sm">{selectedItem.startTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 详细信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">详细信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">结束时间</label>
                      <p className="text-sm">{selectedItem.endTime}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">持续时长</label>
                      <p className="text-sm">{selectedItem.duration}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">实际工作天数</label>
                      <p className="text-sm">{selectedItem.actualWorkDays}天</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">是否加班</label>
                      <p className="text-sm">{selectedItem.overtime}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">施工情况</label>
                      <p className="text-sm">{selectedItem.constructionSituation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">选定施工方式</label>
                      <p className="text-sm">{selectedItem.selectedConstructionMethod}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">前置工序</label>
                      <p className="text-sm">{selectedItem.prerequisiteProcess || "无"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">直接依赖任务</label>
                      <p className="text-sm">{selectedItem.directDependency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">层数</label>
                      <p className="text-sm">{selectedItem.floor}层</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">备注</label>
                      <p className="text-sm">{selectedItem.remarks || "无"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 成本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">成本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">工程量</label>
                      <p className="text-sm">{selectedItem.quantity} {selectedItem.quantityUnit}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">材料价格</label>
                      <p className="text-sm font-medium">¥{selectedItem.materialCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">劳动力成本</label>
                      <p className="text-sm font-medium">¥{selectedItem.laborCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">总成本</label>
                      <p className="text-lg font-bold text-primary">¥{selectedItem.totalCost.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseDetail}>
                  关闭
                </Button>
                <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                  编辑
                </Button>
              </div>
            </div>
          )}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
