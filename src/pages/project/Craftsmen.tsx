import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Upload, User } from "lucide-react";
import { EditCraftsmanDialog } from "@/components/craftsman/EditCraftsmanDialog";
import { ImportCraftsmanDialog } from "@/components/craftsman/ImportCraftsmanDialog";
import { TeamDetailDialog } from "@/components/craftsman/TeamDetailDialog";
import { Craftsman, Team } from "@/types/domain/craftsman";
import { getTeamAssignments } from "@/services/schedulepro-service";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "react-router-dom";

interface CraftsmenProps {
  onActionsChange?: (actions: React.ReactNode) => void;
}

// 班组 Mock 数据已移至 mocks
export function Craftsmen(_props: CraftsmenProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const { token } = useAuth();
  const { id: projectId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !token) return;
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    getTeamAssignments(projectId, token)
      .then((response) => {
        if (!isMounted) return;
        const teamIndex = new Map<string, number>();
        let nextId = 1;
        const teamMap = new Map<string, Team>();

        response.assignments.forEach((assignment) => {
          const teamId = assignment.team_id;
          let numericId = teamIndex.get(teamId);
          if (!numericId) {
            numericId = nextId;
            nextId += 1;
            teamIndex.set(teamId, numericId);
          }

          if (!teamMap.has(teamId)) {
            teamMap.set(teamId, {
              id: numericId,
              name: assignment.team_name || "未命名班组",
              leader: "—",
              leaderPhone: "—",
              trade: "未知",
              memberCount: 0,
              status: "active",
              contractStatus: "未知",
              certificationStatus: "未知",
              entryCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              remarks: `team_id:${teamId}`,
            });
          }

          const team = teamMap.get(teamId)!;
          team.memberCount += assignment.assigned_workers_count ?? 0;
        });

        setTeams(Array.from(teamMap.values()));
      })
      .catch((error) => {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : "加载失败");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, token]);
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
  const handleViewDetail = (team: Team) => {
    setSelectedTeam(team);
    setDetailDialogOpen(true);
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

        {/* Team Cards */}
        <div className="space-y-3">
          {filteredTeams.map(team => {
            // 计算结算进度（示例数据）
            const paidAmount = team.id * 10000; // Mock 数据
            const totalAmount = team.memberCount * 15000; // Mock 数据
            const progress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
            
            return <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* 头像 */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-category-blue-400 to-category-blue-600 flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* 中间区域 */}
                    <div className="flex-1 min-w-0">
                      {/* 名称和信息 */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{team.name}</h3>
                        <span className="text-gray-600">-</span>
                        <span className="font-medium text-gray-700">{team.leader}</span>
                      </div>
                      
                      {/* 联系方式和标签 */}
                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                        <span>📞 {team.leaderPhone}</span>
                        <span className="text-gray-400">|</span>
                        <Badge variant="secondary" className={getTradeColor(team.trade)}>
                          👷 {team.trade}
                        </Badge>
                        <span className="text-gray-400">|</span>
                        <span>👥 {team.memberCount}人</span>
                      </div>

                      {/* 结算进度条 */}
                      <div className="space-y-1">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>已结算: ¥{paidAmount.toLocaleString()}</span>
                          <span>应结算: ¥{totalAmount.toLocaleString()} ({progress}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* 右侧按钮 */}
                    <div className="flex-shrink-0 flex gap-2">
                      <Button variant="outline" onClick={() => handleEdit(team)}>
                        编辑
                      </Button>
                      <Button onClick={() => handleViewDetail(team)}>
                        工作详情
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>;
          })}
          
          {filteredTeams.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                {isLoading
                  ? "班组数据加载中..."
                  : loadError
                    ? `加载失败：${loadError}`
                    : "暂无班组数据"}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {selectedTeam && <>
          <EditCraftsmanDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} craftsman={selectedTeam as unknown as Craftsman} onSave={handleSaveTeam as unknown as (c: Craftsman) => void} />
          <TeamDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} team={selectedTeam} />
        </>}

      <ImportCraftsmanDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImport as unknown as (c: Craftsman[]) => void} />
    </div>;
}
