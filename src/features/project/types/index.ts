export interface Project {
  id: string;
  name: string;
  // 可编辑基础信息字段
  city?: string;
  buildingType?: string;
  structureType?: string;
  bidAmount?: number;
  controlPrice?: number;
  buildingHeight?: number;
  buildingFloors?: number;
  buildingArea?: number;
  status?: string;
  createdAt?: string;
  description?: string;
}
