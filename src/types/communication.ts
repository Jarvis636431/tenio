
export interface CommunicationRecord {
  id: number;
  date: string;
  coordinationType: '设计协同' | '施工协同' | '建立协同' | '建设方协同' | '监管部门协同';
  content: string;
  attachments?: {
    name: string;
    url: string;
    type: 'image' | 'document';
  }[];
  createdBy: string;
  updatedAt: string;
}

export const coordinationTypeColors = {
  '设计协同': 'bg-category-blue-100 text-category-blue-800',
  '施工协同': 'bg-category-green-100 text-category-green-800',
  '建立协同': 'bg-category-yellow-100 text-category-yellow-800',
  '建设方协同': 'bg-category-purple-100 text-category-purple-800',
  '监管部门协同': 'bg-category-red-100 text-category-red-800'
} as const;
