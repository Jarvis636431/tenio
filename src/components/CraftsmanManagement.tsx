import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Upload } from "lucide-react";
import { EditCraftsmanDialog } from "@/components/EditCraftsmanDialog";
import { ImportCraftsmanDialog } from "@/components/ImportCraftsmanDialog";
import { useToast } from "@/hooks/use-toast";
import type { Craftsman, Team } from "@/types/craftsman";

interface CraftsmanManagementProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

// 班组 Mock 数据
const mockTeams: Team[] = [
  {
    id: 1,
    name: "木工一班",
    leader: "张师傅",
    leaderPhone: "138****1234",
    trade: "木工",
    memberCount: 8,
    status: 'active',
    contractStatus: "已签署",
    certificationStatus: "已认证",
    entryCount: 23,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-07-20T16:30:00Z",
    remarks: "技术骨干班组，工作认真负责"
  },
  {
    id: 2,
    name: "电工专业班",
    leader: "李师傅",
    leaderPhone: "139****5678",
    trade: "电工",
    memberCount: 6,
    status: 'active',
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
    status: 'active',
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
    status: 'inactive',
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
    status: 'active',
    contractStatus: "待签署",
    certificationStatus: "已认证",
    entryCount: 8,
    createdAt: "2024-03-01T08:00:00Z",
    updatedAt: "2024-07-20T16:30:00Z",
  },
];
export function CraftsmanManagement({
  showExpandButton,
  onExpandSidebar
}: CraftsmanManagementProps) {
  const {
    toast
  } = useToast();
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           team.leader.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.trade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTrade = tradeFilter === "all" || team.trade === tradeFilter;
      return matchesSearch && matchesTrade;
    });
  }, [teams, searchTerm, tradeFilter]);
  const stats = useMemo(() => {
    const totalTeams = teams.length;
    const totalMembers = teams.reduce((sum, t) => sum + t.memberCount, 0);
    return {
      total: totalTeams,
      totalMembers
    };
  }, [teams]);
  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setEditDialogOpen(true);
  };
  const handleSaveTeam = (updatedTeam: Team) => {
    setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
  };
  const handleImport = (newTeams: Team[]) => {
    setTeams(prev => [...prev, ...newTeams]);
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
  return <div className="h-full flex flex-col space-y-6">

      {/* Stats Cards */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总班组数</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总人数</p>
                  <p className="text-xl font-bold">{stats.totalMembers}</p>
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
              <input type="text" placeholder="搜索班组名称、负责人或工种..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
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
          </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-auto max-h-[calc(100vh-400px)]">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>班组名称</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>工种</TableHead>
                <TableHead>人数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map(team => <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{team.leader}</span>
                      <span className="text-xs text-muted-foreground">{team.leaderPhone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getTradeColor(team.trade)}>
                      {team.trade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{team.memberCount}人</span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(team)}>
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>)}
            </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      {selectedTeam && <EditCraftsmanDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} craftsman={selectedTeam as unknown as Craftsman} onSave={handleSaveTeam as unknown as (c: Craftsman) => void} />}

      <ImportCraftsmanDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImport as unknown as (c: Craftsman[]) => void} />
    </div>;
}