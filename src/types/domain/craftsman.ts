
// 班组数据类型
export interface Team {
  id: number;
  name: string;              // 班组名称
  leader: string;            // 负责人姓名
  leaderPhone: string;       // 负责人电话
  trade: string;             // 工种
  memberCount: number;       // 班组人数
  status: 'active' | 'inactive' | 'departed';
  contractStatus: string;    // 合同状态
  certificationStatus: string; // 认证状态
  entryCount: number;        // 进场次数
  createdAt: string;
  updatedAt: string;
  remarks?: string;
}

// 保留原工匠类型（向后兼容）
export interface Craftsman {
  id: number;
  name: string;
  trade: string;
  level: 1 | 2 | 3 | 4;
  status: 'active' | 'inactive' | 'departed';
  contractStatus: string;
  certificationStatus: string;
  avatar?: string;
  gender: string;
  age: number;
  bio: string;
  phone: string;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
  remarks?: string;
}

export interface EntryExitRecord {
  id: number;
  craftsmanId: number;
  timestamp: string;
  type: 'entry' | 'exit';
  location?: string;
  note?: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: Craftsman[];
  errors: ImportError[];
  total: number;
}
