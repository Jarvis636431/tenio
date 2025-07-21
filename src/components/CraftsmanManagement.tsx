
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserCheck, Award, Clock, Search, Filter, Menu } from "lucide-react";
import { CertificationDialog } from "@/components/CertificationDialog";
import { EntryExitDialog } from "@/components/EntryExitDialog";
import { ContractDialog } from "@/components/ContractDialog";

interface Craftsman {
  id: number;
  name: string;
  trade: string;
  level: 1 | 2 | 3 | 4;
  status: 'active' | 'inactive';
  contractStatus: string;
  certificationStatus: string;
  avatar?: string;
  gender: string;
  age: number;
  bio: string;
  phone: string;
  entryCount: number;
}

const mockCraftsmen: Craftsman[] = [
  {
    id: 1,
    name: "张师傅",
    trade: "木工",
    level: 3,
    status: 'active',
    contractStatus: "已签署",
    certificationStatus: "已认证",
    gender: "男",
    age: 35,
    bio: "拥有15年木工经验，擅长各类木制结构施工和精细木工工艺。",
    phone: "138****1234",
    entryCount: 23
  },
  {
    id: 2,
    name: "李师傅",
    trade: "电工",
    level: 4,
    status: 'active',
    contractStatus: "已签署",
    certificationStatus: "已认证",
    gender: "男",
    age: 42,
    bio: "资深电工，持有高级电工证书，专业从事建筑电气安装和维护。",
    phone: "139****5678",
    entryCount: 31
  },
  {
    id: 3,
    name: "王师傅",
    trade: "钢筋工",
    level: 2,
    status: 'active',
    contractStatus: "已签署",
    certificationStatus: "待认证",
    gender: "男",
    age: 28,
    bio: "钢筋绑扎和焊接技术熟练，有多个大型项目施工经验。",
    phone: "137****9012",
    entryCount: 18
  },
  {
    id: 4,
    name: "刘师傅",
    trade: "混凝土工",
    level: 3,
    status: 'inactive',
    contractStatus: "已签署",
    certificationStatus: "已认证",
    gender: "男",
    age: 39,
    bio: "混凝土浇筑和养护专家，确保工程质量符合标准。",
    phone: "136****3456",
    entryCount: 15
  },
  {
    id: 5,
    name: "赵师傅",
    trade: "木工",
    level: 1,
    status: 'active',
    contractStatus: "待签署",
    certificationStatus: "已认证",
    gender: "男",
    age: 24,
    bio: "新入职木工，学习能力强，积极上进。",
    phone: "135****7890",
    entryCount: 8
  }
];

interface CraftsmanManagementProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

export function CraftsmanManagement({ showExpandButton, onExpandSidebar }: CraftsmanManagementProps) {
  const [selectedCraftsman, setSelectedCraftsman] = useState<Craftsman | null>(null);
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);
  const [entryExitDialogOpen, setEntryExitDialogOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");

  const filteredCraftsmen = useMemo(() => {
    return mockCraftsmen.filter(craftsman => {
      const matchesSearch = craftsman.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           craftsman.trade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTrade = tradeFilter === "all" || craftsman.trade === tradeFilter;
      return matchesSearch && matchesTrade;
    });
  }, [searchTerm, tradeFilter]);

  const stats = useMemo(() => {
    const totalCraftsmen = mockCraftsmen.length;
    const activeCraftsmen = mockCraftsmen.filter(c => c.status === 'active').length;
    const certifiedCraftsmen = mockCraftsmen.filter(c => c.certificationStatus === '已认证').length;
    const certificationRate = Math.round((certifiedCraftsmen / totalCraftsmen) * 100);
    
    return {
      total: totalCraftsmen,
      active: activeCraftsmen,
      certified: certifiedCraftsmen,
      certificationRate
    };
  }, []);

  const getTradeColor = (trade: string) => {
    switch (trade) {
      case "木工": return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "电工": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "钢筋工": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "混凝土工": return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getLevelDisplay = (level: number) => {
    return "★".repeat(level) + "☆".repeat(4 - level);
  };

  const handleViewCertification = (craftsman: Craftsman) => {
    setSelectedCraftsman(craftsman);
    setCertificationDialogOpen(true);
  };

  const handleViewEntryExit = (craftsman: Craftsman) => {
    setSelectedCraftsman(craftsman);
    setEntryExitDialogOpen(true);
  };

  const handleViewContract = (craftsman: Craftsman) => {
    setSelectedCraftsman(craftsman);
    setContractDialogOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          {showExpandButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpandSidebar}
              className="h-8 w-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">工匠管理</h1>
            <p className="text-muted-foreground text-sm">管理工匠信息、资格认证和进出场记录</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总工匠数</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">在场人数</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">已认证</p>
                  <p className="text-2xl font-bold">{stats.certified}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">认证完成率</p>
                  <p className="text-2xl font-bold">{stats.certificationRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索工匠姓名或工种..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">全部工种</option>
            <option value="木工">木工</option>
            <option value="电工">电工</option>
            <option value="钢筋工">钢筋工</option>
            <option value="混凝土工">混凝土工</option>
          </select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
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
              {filteredCraftsmen.map((craftsman) => (
                <TableRow key={craftsman.id}>
                  <TableCell className="font-medium">{craftsman.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getTradeColor(craftsman.trade)}>
                      {craftsman.trade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-yellow-500">{getLevelDisplay(craftsman.level)}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{craftsman.level}级</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${craftsman.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm">{craftsman.status === 'active' ? '在场' : '离场'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={craftsman.certificationStatus === '已认证' ? 'default' : 'secondary'}
                      className={craftsman.certificationStatus === '已认证' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                      {craftsman.certificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{craftsman.entryCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewContract(craftsman)}
                      >
                        合同
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewCertification(craftsman)}
                      >
                        资格认证
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewEntryExit(craftsman)}
                      >
                        进出场记录
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Dialogs */}
      {selectedCraftsman && (
        <>
          <CertificationDialog
            open={certificationDialogOpen}
            onOpenChange={setCertificationDialogOpen}
            craftsman={selectedCraftsman}
          />
          <EntryExitDialog
            open={entryExitDialogOpen}
            onOpenChange={setEntryExitDialogOpen}
            craftsman={selectedCraftsman}
          />
          <ContractDialog
            open={contractDialogOpen}
            onOpenChange={setContractDialogOpen}
            craftsman={selectedCraftsman}
          />
        </>
      )}
    </div>
  );
}
