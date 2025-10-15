
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Craftsman } from "@/types/craftsman";

interface BatchOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCraftsmen: Craftsman[];
  operation: 'outbound' | 'delete';
  onConfirm: (craftsmen: Craftsman[], remarks?: string) => void;
}

export function BatchOperationDialog({ 
  open, 
  onOpenChange, 
  selectedCraftsmen, 
  operation,
  onConfirm 
}: BatchOperationDialogProps) {
  const { toast } = useToast();
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const getOperationText = () => {
    switch (operation) {
      case 'outbound':
        return { title: '批量出库', action: '出库', description: '将选中的工匠标记为已出库状态' };
      case 'delete':
        return { title: '批量删除', action: '删除', description: '永久删除选中的工匠记录' };
      default:
        return { title: '批量操作', action: '操作', description: '' };
    }
  };

  const operationInfo = getOperationText();

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟处理时间
      onConfirm(selectedCraftsmen, remarks);
      toast({
        title: `${operationInfo.action}成功`,
        description: `已${operationInfo.action} ${selectedCraftsmen.length} 名工匠`,
      });
      onOpenChange(false);
      setRemarks("");
    } catch (error) {
      toast({
        title: `${operationInfo.action}失败`,
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTradeColor = (trade: string) => {
    switch (trade) {
      case "木工": return "bg-amber-100 text-amber-800";
      case "电工": return "bg-category-yellow-100 text-category-yellow-800";
      case "钢筋工": return "bg-category-blue-100 text-category-blue-800";
      case "混凝土工": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-category-orange-600" />
            {operationInfo.title}确认
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-category-orange-50 border border-category-orange-200 rounded-lg p-4">
            <p className="text-sm text-category-orange-800">
              {operationInfo.description}，此操作将影响 <span className="font-semibold">{selectedCraftsmen.length}</span> 名工匠
              {operation === 'delete' && '，删除后无法恢复'}。
            </p>
          </div>

          {/* 工匠列表 */}
          <div className="space-y-2">
            <Label>选中的工匠 ({selectedCraftsmen.length}人)</Label>
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>工种</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCraftsmen.map((craftsman) => (
                    <TableRow key={craftsman.id}>
                      <TableCell className="font-medium">{craftsman.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getTradeColor(craftsman.trade)}>
                          {craftsman.trade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-category-yellow-600">{"★".repeat(craftsman.level)}{"☆".repeat(4 - craftsman.level)}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{craftsman.level}级</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${craftsman.status === 'active' ? 'bg-category-green-600' : 'bg-gray-400'}`} />
                          <span className="text-sm">
                            {craftsman.status === 'active' ? '在场' : craftsman.status === 'departed' ? '已出库' : '离场'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="remarks">
              {operation === 'outbound' ? '出库' : '操作'}备注
              {operation === 'outbound' && ' (可选)'}
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={`请输入${operationInfo.action}原因或备注信息`}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button 
            variant="ghost" 
            className={operation === 'delete' ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : 'text-primary hover:text-primary hover:bg-primary/10'}
            onClick={handleConfirm} 
            disabled={isProcessing}
          >
            {isProcessing ? `${operationInfo.action}中...` : `确认${operationInfo.action}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
