import type { Craftsman, Team } from "@/types/domain/craftsman";

export type TeamTask = {
  id: number;
  name: string;
  amount: number;
  isCompleted: boolean;
  isSettled: boolean;
};

export function createImportCraftsmanMockData(): Craftsman[] {
  const baseTime = Date.now();
  const now = new Date().toISOString();

  return [
    {
      id: baseTime + 1,
      name: "新工匠1",
      trade: "木工",
      level: 2,
      status: "active",
      contractStatus: "已签署",
      certificationStatus: "已认证",
      gender: "男",
      age: 30,
      bio: "有5年工作经验",
      phone: "138****0001",
      entryCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: baseTime + 2,
      name: "新工匠2",
      trade: "电工",
      level: 3,
      status: "active",
      contractStatus: "待签署",
      certificationStatus: "待认证",
      gender: "男",
      age: 28,
      bio: "电工专业技能证书",
      phone: "138****0002",
      entryCount: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export const mockTeams: Team[] = [
  {
    id: 1,
    name: "木工一班",
    leader: "张师傅",
    leaderPhone: "138****1234",
    trade: "木工",
    memberCount: 8,
    status: "active",
    contractStatus: "已签署",
    certificationStatus: "已认证",
    entryCount: 23,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-07-20T16:30:00Z",
    remarks: "技术骨干班组，工作认真负责",
  },
  {
    id: 2,
    name: "电工专业班",
    leader: "李师傅",
    leaderPhone: "139****5678",
    trade: "电工",
    memberCount: 6,
    status: "active",
    contractStatus: "已签署",
    certificationStatus: "已认证",
    entryCount: 31,
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-07-20T16:30:00Z",
  },
  {
    id: 3,
    name: "钢筋工二班",
    leader: "王师傅",
    leaderPhone: "137****9012",
    trade: "钢筋工",
    memberCount: 10,
    status: "active",
    contractStatus: "已签署",
    certificationStatus: "待认证",
    entryCount: 18,
    createdAt: "2024-02-01T08:00:00Z",
    updatedAt: "2024-07-20T16:30:00Z",
  },
  {
    id: 4,
    name: "混凝土专业组",
    leader: "刘师傅",
    leaderPhone: "136****3456",
    trade: "混凝土工",
    memberCount: 12,
    status: "inactive",
    contractStatus: "已签署",
    certificationStatus: "已认证",
    entryCount: 15,
    createdAt: "2024-01-20T08:00:00Z",
    updatedAt: "2024-07-20T16:30:00Z",
  },
  {
    id: 5,
    name: "木工二班",
    leader: "赵师傅",
    leaderPhone: "135****7890",
    trade: "木工",
    memberCount: 5,
    status: "active",
    contractStatus: "待签署",
    certificationStatus: "已认证",
    entryCount: 8,
    createdAt: "2024-03-01T08:00:00Z",
    updatedAt: "2024-07-20T16:30:00Z",
  },
];

export const mockTeamTasks: TeamTask[] = [
  {
    id: 1,
    name: "基础开挖",
    amount: 25000,
    isCompleted: true,
    isSettled: true,
  },
  {
    id: 2,
    name: "钢筋绑扎",
    amount: 35000,
    isCompleted: true,
    isSettled: true,
  },
  {
    id: 3,
    name: "模板安装",
    amount: 28000,
    isCompleted: true,
    isSettled: false,
  },
  {
    id: 4,
    name: "混凝土浇筑",
    amount: 42000,
    isCompleted: false,
    isSettled: false,
  },
  {
    id: 5,
    name: "模板拆除",
    amount: 18000,
    isCompleted: false,
    isSettled: false,
  },
];
