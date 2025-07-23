
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, Menu } from "lucide-react";
import { AddCommunicationDialog } from "./AddCommunicationDialog";
import { EditCommunicationDialog } from "./EditCommunicationDialog";
import { CommunicationDetailDialog } from "./CommunicationDetailDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CommunicationRecord, coordinationTypeColors } from "@/types/communication";
import { useToast } from "@/hooks/use-toast";

interface CommunicationCollaborationProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

// 模拟数据
const mockData: CommunicationRecord[] = [
  {
    id: 1,
    date: "2024-01-15",
    coordinationType: "设计协同",
    content: "与设计院协调建筑外立面材料变更事宜，需要调整原有石材方案为新型复合材料",
    attachments: [
      { name: "设计变更图纸.pdf", url: "/placeholder.svg", type: "document" },
      { name: "材料样板.jpg", url: "/placeholder.svg", type: "image" }
    ],
    createdBy: "张工程师",
    updatedAt: "2024-01-15 14:30"
  },
  {
    id: 2,
    date: "2024-01-16",
    coordinationType: "施工协同",
    content: "现场施工进度调整，由于天气原因需要延后混凝土浇筑时间",
    createdBy: "李项目经理",
    updatedAt: "2024-01-16 09:15"
  },
  {
    id: 3,
    date: "2024-01-17",
    coordinationType: "监管部门协同",
    content: "质监站检查反馈，钢筋绑扎需要按照最新规范标准执行",
    createdBy: "王质检员",
    updatedAt: "2024-01-17 16:45"
  }
];

export function CommunicationCollaboration({ showExpandButton, onExpandSidebar }: CommunicationCollaborationProps) {
  const [data, setData] = useState<CommunicationRecord[]>(mockData);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CommunicationRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<CommunicationRecord | null>(null);
  const { toast } = useToast();

  const filteredData = data.filter(record => {
    const matchesSearch = record.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || record.coordinationType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAdd = (newRecord: Omit<CommunicationRecord, 'id' | 'createdBy' | 'updatedAt'>) => {
    const record: CommunicationRecord = {
      ...newRecord,
      id: Math.max(...data.map(d => d.id)) + 1,
      createdBy: "当前用户",
      updatedAt: new Date().toLocaleString('zh-CN')
    };
    setData([record, ...data]);
    toast({
      title: "添加成功",
      description: "沟通协作记录已添加"
    });
  };

  const handleEdit = (updatedRecord: CommunicationRecord) => {
    setData(data.map(record => 
      record.id === updatedRecord.id 
        ? { ...updatedRecord, updatedAt: new Date().toLocaleString('zh-CN') }
        : record
    ));
    toast({
      title: "编辑成功",
      description: "沟通协作记录已更新"
    });
  };

  const handleDelete = (id: number) => {
    setData(data.filter(record => record.id !== id));
    toast({
      title: "删除成功",
      description: "沟通协作记录已删除"
    });
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  };

  return (
    <div className="flex-1 p-6 space-y-6">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索沟通内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="协调类型筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="设计协同">设计协同</SelectItem>
              <SelectItem value="施工协同">施工协同</SelectItem>
              <SelectItem value="建立协同">建立协同</SelectItem>
              <SelectItem value="建设方协同">建设方协同</SelectItem>
              <SelectItem value="监管部门协同">监管部门协同</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          上传记录
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">序号</TableHead>
              <TableHead className="w-28">日期</TableHead>
              <TableHead className="w-32">协调类型</TableHead>
              <TableHead>沟通内容</TableHead>
              <TableHead className="w-32">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((record, index) => (
              <TableRow key={record.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{record.date}</TableCell>
                <TableCell>
                  <Badge className={coordinationTypeColors[record.coordinationType]}>
                    {record.coordinationType}
                  </Badge>
                </TableCell>
                <TableCell>{truncateContent(record.content)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingRecord(record)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRecord(record)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除这条沟通协作记录吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(record.id)}>
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddCommunicationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAdd}
      />

      {editingRecord && (
        <EditCommunicationDialog
          open={!!editingRecord}
          onOpenChange={(open) => !open && setEditingRecord(null)}
          record={editingRecord}
          onEdit={handleEdit}
        />
      )}

      {viewingRecord && (
        <CommunicationDetailDialog
          open={!!viewingRecord}
          onOpenChange={(open) => !open && setViewingRecord(null)}
          record={viewingRecord}
        />
      )}
    </div>
  );
}
