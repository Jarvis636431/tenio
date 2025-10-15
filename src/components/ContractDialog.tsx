
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, DollarSign, Clock, CheckCircle } from "lucide-react";

interface Craftsman {
  id: number;
  name: string;
  trade: string;
  contractStatus: string;
}

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  craftsman: Craftsman;
}

export function ContractDialog({ open, onOpenChange, craftsman }: ContractDialogProps) {
  // 模拟合同数据
  const contractData = {
    contractNumber: `CON-${craftsman.id.toString().padStart(6, '0')}`,
    signDate: '2024-01-15',
    startDate: '2024-02-01',
    endDate: '2024-12-31',
    workType: craftsman.trade,
    dailyWage: 350,
    overtimeRate: 1.5,
    totalAmount: 91000,
    clauses: [
      '遵守工地安全规定，佩戴安全防护设备',
      '按时出勤，无故缺席扣除相应工资',
      '完成指定的工作任务，保证工程质量',
      '服从现场管理人员的工作安排',
      '爱护施工设备和材料，损坏照价赔偿'
    ],
    status: craftsman.contractStatus
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已签署': return 'bg-category-green-100 text-category-green-800';
      case '待签署': return 'bg-category-yellow-100 text-category-yellow-800';
      case '已到期': return 'bg-category-red-100 text-category-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = () => {
    // 模拟下载合同文件
    console.log('下载合同文件:', contractData.contractNumber);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            合同详情 - {craftsman.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 合同基本信息 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>合同基本信息</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(contractData.status)}>
                    {contractData.status}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    下载合同
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">合同编号</label>
                  <p className="text-lg font-semibold">{contractData.contractNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">工种</label>
                  <p className="text-lg">{contractData.workType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">签署日期</label>
                  <p className="text-lg">{contractData.signDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">合同状态</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(contractData.status)}>
                      {contractData.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 合同期限 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                合同期限
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="p-2 bg-category-blue-100 rounded-lg">
                    <Clock className="h-5 w-5 text-category-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">合同开始</p>
                    <p className="text-lg font-semibold">{contractData.startDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="p-2 bg-category-red-100 rounded-lg">
                    <Clock className="h-5 w-5 text-category-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">合同结束</p>
                    <p className="text-lg font-semibold">{contractData.endDate}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 薪资条款 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                薪资条款
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="p-2 bg-category-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-category-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">日工资</p>
                    <p className="text-lg font-semibold">¥{contractData.dailyWage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="p-2 bg-category-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-category-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">加班倍率</p>
                    <p className="text-lg font-semibold">{contractData.overtimeRate}倍</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="p-2 bg-category-purple-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-category-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">合同总额</p>
                    <p className="text-lg font-semibold">¥{contractData.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 合同条款 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                主要条款
              </CardTitle>
              <CardDescription>合同中的重要条款和规定</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contractData.clauses.map((clause, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{clause}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 签署信息 */}
          {contractData.status === '已签署' && (
            <Card>
              <CardHeader>
                <CardTitle>签署信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">甲方签署</label>
                    <div className="mt-2 p-3 bg-category-green-50 border border-category-green-200 rounded-lg">
                      <p className="font-medium">建设单位有限公司</p>
                      <p className="text-sm text-muted-foreground">签署时间: {contractData.signDate}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">乙方签署</label>
                    <div className="mt-2 p-3 bg-category-green-50 border border-category-green-200 rounded-lg">
                      <p className="font-medium">{craftsman.name}</p>
                      <p className="text-sm text-muted-foreground">签署时间: {contractData.signDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
