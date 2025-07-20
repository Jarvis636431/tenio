import { useState } from "react";
import { Upload, FileText, Wrench, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function NewProject() {
  const [bidNotice, setBidNotice] = useState<File | null>(null);
  const [controlPrice, setControlPrice] = useState("");
  const [cadFile, setCadFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = event.target.files?.[0] || null;
    setter(file);
  };

  const handleStartAnalysis = () => {
    if (!bidNotice || !controlPrice || !cadFile) {
      toast({
        title: "请完善信息",
        description: "请上传所需文件并输入内部控制价",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "开始解析",
      description: "正在解析项目文件，请稍候...",
    });

    // 这里会触发创建新项目的逻辑
    // 实际应用中会导航到新创建的项目页面
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">新建项目</h1>
        <p className="text-muted-foreground">
          上传项目文件并设置基础信息以开始项目管理
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 中标通知书上传 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              中标通知书
            </CardTitle>
            <CardDescription>上传 PDF 格式的中标通知书</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {bidNotice ? bidNotice.name : "点击或拖拽上传 PDF 文件"}
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, setBidNotice)}
                    className="hidden"
                    id="bid-notice"
                  />
                  <Label htmlFor="bid-notice" className="cursor-pointer">
                    <Button variant="outline" type="button">
                      选择文件
                    </Button>
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 内部控制价 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              内部控制价
            </CardTitle>
            <CardDescription>设置项目的内部控制价百分比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="control-price">控制价百分比</Label>
                <div className="relative">
                  <Input
                    id="control-price"
                    type="number"
                    placeholder="输入百分比"
                    value={controlPrice}
                    onChange={(e) => setControlPrice(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  例如：95 表示控制价为投标价的 95%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CAD 文件上传 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              CAD 图纸
            </CardTitle>
            <CardDescription>上传 DWG 格式的 CAD 图纸文件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {cadFile ? cadFile.name : "点击或拖拽上传 DWG 文件"}
                  </p>
                  <input
                    type="file"
                    accept=".dwg"
                    onChange={(e) => handleFileUpload(e, setCadFile)}
                    className="hidden"
                    id="cad-file"
                  />
                  <Label htmlFor="cad-file" className="cursor-pointer">
                    <Button variant="outline" type="button">
                      选择文件
                    </Button>
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 开始解析按钮 */}
        <Card>
          <CardHeader>
            <CardTitle>项目解析</CardTitle>
            <CardDescription>
              完成上述文件上传后，点击开始解析生成项目
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleStartAnalysis}
              className="w-full"
              size="lg"
              disabled={!bidNotice || !controlPrice || !cadFile}
            >
              <Play className="mr-2 h-4 w-4" />
              开始解析
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}