
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileSpreadsheet, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createImportCraftsmanMockData } from "@/mocks/data/craftsman";
import { ImportResult, Craftsman } from "@/types/domain/craftsman";

interface ImportCraftsmanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (craftsmen: Craftsman[]) => void;
}

export function ImportCraftsmanDialog({ open, onOpenChange, onImport }: ImportCraftsmanDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewData, setPreviewData] = useState<Craftsman[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processFile();
    }
  };

  const processFile = async () => {
    setIsProcessing(true);
    setProgress(0);

    // 模拟文件处理过程
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      // 模拟解析CSV/Excel文件
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = createImportCraftsmanMockData();

      setPreviewData(mockData);
      setProgress(100);
      toast({
        title: "文件解析成功",
        description: `发现 ${mockData.length} 条工匠记录`,
      });
    } catch (error) {
      toast({
        title: "文件解析失败",
        description: "请检查文件格式是否正确",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setIsProcessing(true);
    try {
      // 模拟导入过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result: ImportResult = {
        success: previewData,
        errors: [],
        total: previewData.length,
      };

      setImportResult(result);
      onImport(previewData);
      
      toast({
        title: "导入成功",
        description: `成功导入 ${result.success.length} 条工匠记录`,
      });
    } catch (error) {
      toast({
        title: "导入失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    // 模拟下载模板文件
    toast({
      title: "模板下载",
      description: "导入模板已开始下载",
    });
  };

  const reset = () => {
    setPreviewData([]);
    setImportResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) reset();
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>批量导入工匠数据</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 文件上传区域 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>选择文件</Label>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                下载模板
              </Button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">支持 Excel (.xlsx) 和 CSV 格式文件</p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="max-w-xs mx-auto"
                />
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>处理进度</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>

          {/* 数据预览 */}
          {previewData.length > 0 && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">数据预览</h4>
                <span className="text-sm text-gray-500">共 {previewData.length} 条记录</span>
              </div>
              
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>工种</TableHead>
                      <TableHead>等级</TableHead>
                      <TableHead>性别</TableHead>
                      <TableHead>年龄</TableHead>
                      <TableHead>联系方式</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((craftsman, index) => (
                      <TableRow key={index}>
                        <TableCell>{craftsman.name}</TableCell>
                        <TableCell>{craftsman.trade}</TableCell>
                        <TableCell>{craftsman.level}级</TableCell>
                        <TableCell>{craftsman.gender}</TableCell>
                        <TableCell>{craftsman.age}</TableCell>
                        <TableCell>{craftsman.phone}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* 导入结果 */}
          {importResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                导入完成！成功导入 {importResult.success.length} 条记录
                {importResult.errors.length > 0 && `，${importResult.errors.length} 条记录失败`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          {previewData.length > 0 && !importResult && (
            <Button onClick={handleImport} disabled={isProcessing}>
              {isProcessing ? "导入中..." : `导入 ${previewData.length} 条记录`}
            </Button>
          )}
          {importResult && (
            <Button onClick={() => onOpenChange(false)}>
              完成
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
