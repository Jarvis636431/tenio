import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, UserCheck, Award, Clock, Search, Upload, Edit, Menu, X } from "lucide-react";
import { CertificationDialog } from "@/components/CertificationDialog";
import { EntryExitDialog } from "@/components/EntryExitDialog";
import { ContractDialog } from "@/components/ContractDialog";
import { EditCraftsmanDialog } from "@/components/EditCraftsmanDialog";
import { ImportCraftsmanDialog } from "@/components/ImportCraftsmanDialog";
import { BatchOperationDialog } from "@/components/BatchOperationDialog";
import { ExportDropdown } from "@/components/ExportDropdown";
import { useToast } from "@/hooks/use-toast";
import type { Craftsman } from "@/types/craftsman";
interface CraftsmanManagementProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}
const mockCraftsmen: Craftsman[] = [{
  id: 1,
  name: "张师傅",
  trade: "木工",
  level: 3,
  status: 'active',
  contractStatus: "已签署",
  certificationStatus: "已认证",
  avatar: undefined,
  gender: "男",
  age: 35,
  bio: "拥有15年木工经验，擅长各类木制结构施工和精细木工工艺。",
  phone: "138****1234",
  entryCount: 23,
  createdAt: "2024-01-15T08:00:00Z",
  updatedAt: "2024-07-20T16:30:00Z",
  remarks: "技术骨干，工作认真负责"
}, {
  id: 2,
  name: "李师傅",
  trade: "电工",
  level: 4,
  status: 'active',
  contractStatus: "已签署",
  certificationStatus: "已认证",
  avatar: undefined,
  gender: "男",
  age: 42,
  bio: "资深电工，持有高级电工证书，专业从事建筑电气安装和维护。",
  phone: "139****5678",
  entryCount: 31,
  createdAt: "2024-01-10T08:00:00Z",
  updatedAt: "2024-07-20T16:30:00Z"
}, {
  id: 3,
  name: "王师傅",
  trade: "钢筋工",
  level: 2,
  status: 'active',
  contractStatus: "已签署",
  certificationStatus: "待认证",
  avatar: undefined,
  gender: "男",
  age: 28,
  bio: "钢筋绑扎和焊接技术熟练，有多个大型项目施工经验。",
  phone: "137****9012",
  entryCount: 18,
  createdAt: "2024-02-01T08:00:00Z",
  updatedAt: "2024-07-20T16:30:00Z"
}, {
  id: 4,
  name: "刘师傅",
  trade: "混凝土工",
  level: 3,
  status: 'inactive',
  contractStatus: "已签署",
  certificationStatus: "已认证",
  avatar: undefined,
  gender: "男",
  age: 39,
  bio: "混凝土浇筑和养护专家，确保工程质量符合标准。",
  phone: "136****3456",
  entryCount: 15,
  createdAt: "2024-01-20T08:00:00Z",
  updatedAt: "2024-07-20T16:30:00Z"
}, {
  id: 5,
  name: "赵师傅",
  trade: "木工",
  level: 1,
  status: 'active',
  contractStatus: "待签署",
  certificationStatus: "已认证",
  avatar: undefined,
  gender: "男",
  age: 24,
  bio: "新入职木工，学习能力强，积极上进。",
  phone: "135****7890",
  entryCount: 8,
  createdAt: "2024-03-01T08:00:00Z",
  updatedAt: "2024-07-20T16:30:00Z"
}];
export function CraftsmanManagement({
  showExpandButton,
  onExpandSidebar
}: CraftsmanManagementProps) {
  const {
    toast
  } = useToast();
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>(mockCraftsmen);
  const [selectedCraftsman, setSelectedCraftsman] = useState<Craftsman | null>(null);
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);
  const [entryExitDialogOpen, setEntryExitDialogOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchOperation, setBatchOperation] = useState<'outbound' | 'delete'>('outbound');
  const [searchTerm, setSearchTerm] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const filteredCraftsmen = useMemo(() => {
    return craftsmen.filter(craftsman => {
      const matchesSearch = craftsman.name.toLowerCase().includes(searchTerm.toLowerCase()) || craftsman.trade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTrade = tradeFilter === "all" || craftsman.trade === tradeFilter;
      return matchesSearch && matchesTrade;
    });
  }, [craftsmen, searchTerm, tradeFilter]);
  const selectedCraftsmen = useMemo(() => {
    return craftsmen.filter(craftsman => selectedIds.includes(craftsman.id));
  }, [craftsmen, selectedIds]);
  const stats = useMemo(() => {
    const totalCraftsmen = craftsmen.length;
    const activeCraftsmen = craftsmen.filter(c => c.status === 'active').length;
    const certifiedCraftsmen = craftsmen.filter(c => c.certificationStatus === '已认证').length;
    const certificationRate = totalCraftsmen > 0 ? Math.round(certifiedCraftsmen / totalCraftsmen * 100) : 0;
    return {
      total: totalCraftsmen,
      active: activeCraftsmen,
      certified: certifiedCraftsmen,
      certificationRate
    };
  }, [craftsmen]);
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCraftsmen.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelectOne = (craftsmanId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, craftsmanId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== craftsmanId));
    }
  };
  const handleEdit = (craftsman: Craftsman) => {
    setSelectedCraftsman(craftsman);
    setEditDialogOpen(true);
  };
  const handleSaveCraftsman = (updatedCraftsman: Craftsman) => {
    setCraftsmen(prev => prev.map(c => c.id === updatedCraftsman.id ? updatedCraftsman : c));
  };
  const handleImport = (newCraftsmen: Craftsman[]) => {
    setCraftsmen(prev => [...prev, ...newCraftsmen]);
  };
  const handleBatchOperation = (operation: 'outbound' | 'delete') => {
    if (selectedIds.length === 0) {
      toast({
        title: "请选择工匠",
        description: "请先选择要操作的工匠",
        variant: "destructive"
      });
      return;
    }
    setBatchOperation(operation);
    setBatchDialogOpen(true);
  };
  const handleBatchConfirm = (craftsmen: Craftsman[], remarks?: string) => {
    if (batchOperation === 'delete') {
      setCraftsmen(prev => prev.filter(c => !selectedIds.includes(c.id)));
    } else if (batchOperation === 'outbound') {
      setCraftsmen(prev => prev.map(c => selectedIds.includes(c.id) ? {
        ...c,
        status: 'departed' as const,
        remarks: remarks || c.remarks,
        updatedAt: new Date().toISOString()
      } : c));
    }
    setSelectedIds([]);
  };
  const getTradeColor = (trade: string) => {
    switch (trade) {
      case "木工":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "电工":
        return "bg-category-yellow-100 text-category-yellow-800 hover:bg-category-yellow-200";
      case "钢筋工":
        return "bg-category-blue-100 text-category-blue-800 hover:bg-category-blue-200";
      case "混凝土工":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  const getLevelDisplay = (level: number) => {
    return "★".repeat(level) + "☆".repeat(4 - level);
  };
  const allSelected = filteredCraftsmen.length > 0 && filteredCraftsmen.every(c => selectedIds.includes(c.id));
  const someSelected = selectedIds.length > 0;
  return <div className="h-full flex flex-col space-y-6">

      {/* Stats Cards */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总工匠数</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">在场人数</p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">已认证</p>
                  <p className="text-xl font-bold">{stats.certified}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">认证完成率</p>
                  <p className="text-xl font-bold">{stats.certificationRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
          <div className="flex gap-4 flex-1">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="搜索工匠姓名或工种..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
            <Select value={tradeFilter} onValueChange={setTradeFilter}>
              <SelectTrigger className="w-48 bg-background">
                <SelectValue placeholder="筛选工种" />
              </SelectTrigger>
              <SelectContent className="bg-background border">
                <SelectItem value="all">全部工种</SelectItem>
                <SelectItem value="木工">木工</SelectItem>
                <SelectItem value="电工">电工</SelectItem>
                <SelectItem value="钢筋工">钢筋工</SelectItem>
                <SelectItem value="混凝土工">混凝土工</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              批量导入
            </Button>
            <ExportDropdown allCraftsmen={craftsmen} filteredCraftsmen={filteredCraftsmen} selectedCraftsmen={selectedCraftsmen} />
          </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Operations Toolbar */}
        {selectedIds.length > 0 && <div className="bg-category-blue-50 border border-category-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  已选中 {selectedIds.length} 名工匠
                </span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleBatchOperation('outbound')}>
                    批量出库
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleBatchOperation('delete')}>
                    批量删除
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                <X className="h-4 w-4 mr-2" />
                取消选择
              </Button>
            </div>
          </div>}

        {/* Table */}
        <Card>
          <div className="overflow-auto max-h-[calc(100vh-400px)]">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} aria-label="全选" />
                </TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>工种</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>认证状态</TableHead>
                <TableHead>进场次数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCraftsmen.map(craftsman => <TableRow key={craftsman.id}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(craftsman.id)} onCheckedChange={checked => handleSelectOne(craftsman.id, checked as boolean)} aria-label={`选择${craftsman.name}`} />
                  </TableCell>
                  <TableCell className="font-medium">{craftsman.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getTradeColor(craftsman.trade)}>
                      {craftsman.trade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{craftsman.level}级</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${craftsman.status === 'active' ? 'bg-category-green-600' : craftsman.status === 'departed' ? 'bg-category-orange-600' : 'bg-gray-400'}`} />
                      <span className="text-sm">
                        {craftsman.status === 'active' ? '在场' : craftsman.status === 'departed' ? '已出库' : '离场'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={craftsman.certificationStatus === '已认证' ? 'default' : 'secondary'} className={craftsman.certificationStatus === '已认证' ? 'bg-category-green-100 text-category-green-800' : 'bg-category-yellow-100 text-category-yellow-800'}>
                      {craftsman.certificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{craftsman.entryCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(craftsman)}>
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                    setSelectedCraftsman(craftsman);
                    setContractDialogOpen(true);
                  }}>
                        合同
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                    setSelectedCraftsman(craftsman);
                    setCertificationDialogOpen(true);
                  }}>
                        资格认证
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                    setSelectedCraftsman(craftsman);
                    setEntryExitDialogOpen(true);
                  }}>
                        进出场记录
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      {selectedCraftsman && <>
          <CertificationDialog open={certificationDialogOpen} onOpenChange={setCertificationDialogOpen} craftsman={selectedCraftsman} />
          <EntryExitDialog open={entryExitDialogOpen} onOpenChange={setEntryExitDialogOpen} craftsman={selectedCraftsman} />
          <ContractDialog open={contractDialogOpen} onOpenChange={setContractDialogOpen} craftsman={selectedCraftsman} />
          <EditCraftsmanDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} craftsman={selectedCraftsman} onSave={handleSaveCraftsman} />
        </>}

      <ImportCraftsmanDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImport} />

      <BatchOperationDialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen} selectedCraftsmen={selectedCraftsmen} operation={batchOperation} onConfirm={handleBatchConfirm} />
    </div>;
}