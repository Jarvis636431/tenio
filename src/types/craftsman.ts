
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
