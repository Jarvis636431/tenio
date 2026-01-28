import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Phone, Users, Briefcase, DollarSign, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Team } from "@/types/domain/craftsman";
import { mockTeamTasks } from "@/mocks/data/craftsman";

interface TeamDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export function TeamDetailDialog({ open, onOpenChange, team }: TeamDetailDialogProps) {
  if (!team) return null;

  // 计算结算进度（示例数据）
  const paidAmount = team.id * 10000;
  const totalAmount = team.memberCount * 15000;
  const progress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const mockTasks = mockTeamTasks;

  const getTradeColor = (trade: string) => {
    switch (trade) {
      case "木工":
        return "bg-amber-100 text-amber-800";
      case "电工":
        return "bg-category-yellow-100 text-category-yellow-800";
      case "钢筋工":
        return "bg-category-blue-100 text-category-blue-800";
      case "混凝土工":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">班组工作详情</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本信息卡片 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* 头像 */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-category-blue-400 to-category-blue-600 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* 基本信息 */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{team.name}</h3>
                    <Badge variant="secondary" className={getTradeColor(team.trade)}>
                      {team.trade}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">负责人：</span>
                      <span className="font-medium">{team.leader}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">联系方式：</span>
                      <span className="font-medium">{team.leaderPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">班组人数：</span>
                      <span className="font-medium">{team.memberCount}人</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">合同状态：</span>
                      <span className="font-medium">{team.contractStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 结算信息卡片 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-category-green-600" />
                <h4 className="text-lg font-semibold">结算信息</h4>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-category-green-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">已结算金额</div>
                    <div className="text-2xl font-bold text-category-green-700">
                      ¥{paidAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-category-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">应结算金额</div>
                    <div className="text-2xl font-bold text-category-blue-700">
                      ¥{totalAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-category-orange-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">结算进度</div>
                    <div className="text-2xl font-bold text-category-orange-700">
                      {progress}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>未结算：¥{(totalAmount - paidAmount).toLocaleString()}</span>
                    <span>完成度：{progress}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 工序列表卡片 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-category-purple-600" />
                <h4 className="text-lg font-semibold">工序列表</h4>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">工序名称</TableHead>
                      <TableHead className="font-semibold text-right">金额</TableHead>
                      <TableHead className="font-semibold text-center">完成状态</TableHead>
                      <TableHead className="font-semibold text-center">结算状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell className="text-right font-semibold text-gray-700">
                          ¥{task.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {task.isCompleted ? (
                            <Badge className="bg-category-green-100 text-category-green-800 hover:bg-category-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              已完成
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              <Clock className="w-3 h-3 mr-1" />
                              进行中
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {task.isSettled ? (
                            <Badge className="bg-category-blue-100 text-category-blue-800 hover:bg-category-blue-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              已结算
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-category-orange-100 text-category-orange-700">
                              <XCircle className="w-3 h-3 mr-1" />
                              未结算
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 工序统计 */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-gray-600 mb-1">总工序</div>
                  <div className="text-xl font-bold text-gray-900">{mockTasks.length}</div>
                </div>
                <div className="p-3 bg-category-green-50 rounded-lg text-center">
                  <div className="text-gray-600 mb-1">已完成</div>
                  <div className="text-xl font-bold text-category-green-700">
                    {mockTasks.filter(t => t.isCompleted).length}
                  </div>
                </div>
                <div className="p-3 bg-category-blue-50 rounded-lg text-center">
                  <div className="text-gray-600 mb-1">已结算</div>
                  <div className="text-xl font-bold text-category-blue-700">
                    {mockTasks.filter(t => t.isSettled).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 工作记录卡片 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-category-blue-600" />
                <h4 className="text-lg font-semibold">工作记录</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">创建时间</span>
                  <span className="font-medium">{new Date(team.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">最后更新</span>
                  <span className="font-medium">{new Date(team.updatedAt).toLocaleString('zh-CN')}</span>
                </div>
                {team.remarks && (
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600 block mb-1">备注</span>
                    <p className="text-sm">{team.remarks}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
