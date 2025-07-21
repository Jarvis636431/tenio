
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Craftsman } from "@/types/craftsman";

interface ExportDropdownProps {
  allCraftsmen: Craftsman[];
  filteredCraftsmen: Craftsman[];
  selectedCraftsmen: Craftsman[];
}

export function ExportDropdown({ allCraftsmen, filteredCraftsmen, selectedCraftsmen }: ExportDropdownProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (data: Craftsman[], filename: string, format: 'excel' | 'csv') => {
    setIsExporting(true);
    try {
      // 模拟导出过程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Exporting ${data.length} craftsmen to ${format}:`, filename);
      
      toast({
        title: "导出成功",
        description: `已导出 ${data.length} 条工匠记录为 ${format.toUpperCase()} 格式`,
      });
    } catch (error) {
      toast({
        title: "导出失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      label: "导出全部数据",
      data: allCraftsmen,
      filename: "全部工匠数据",
      disabled: allCraftsmen.length === 0,
    },
    {
      label: "导出筛选结果",
      data: filteredCraftsmen,
      filename: "筛选工匠数据",
      disabled: filteredCraftsmen.length === 0,
    },
    {
      label: "导出选中数据",
      data: selectedCraftsmen,
      filename: "选中工匠数据",
      disabled: selectedCraftsmen.length === 0,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "导出中..." : "导出"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {exportOptions.map((option, index) => (
          <div key={index}>
            {index > 0 && <DropdownMenuSeparator />}
            <div className="px-2 py-1.5">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {option.label} ({option.data.length}条)
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  disabled={option.disabled}
                  onClick={() => exportData(option.data, option.filename, 'excel')}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  disabled={option.disabled}
                  onClick={() => exportData(option.data, option.filename, 'csv')}
                >
                  <File className="h-3 w-3 mr-1" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
