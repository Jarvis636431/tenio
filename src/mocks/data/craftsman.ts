import type { Craftsman } from "@/types/domain/craftsman";

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
