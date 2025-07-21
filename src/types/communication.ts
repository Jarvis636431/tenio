
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
  '设计协同': 'bg-blue-100 text-blue-800',
  '施工协同': 'bg-green-100 text-green-800',
  '建立协同': 'bg-yellow-100 text-yellow-800',
  '建设方协同': 'bg-purple-100 text-purple-800',
  '监管部门协同': 'bg-red-100 text-red-800'
} as const;
