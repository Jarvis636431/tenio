import { useState } from "react";
import { Upload, FileText, Wrench, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function NewProject() {
  const [bidNotice, setBidNotice] = useState<File | null>(null);
  const [controlPrice, setControlPrice] = useState("");
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = event.target.files?.[0] || null;
    setter(file);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    setter: (file: File | null) => void,
    acceptedTypes: string[]
  ) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // 检查文件类型
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (acceptedTypes.includes(fileExtension)) {
        setter(file);
      } else {
        toast({
          title: "文件格式不支持",
          description: `请上传 ${acceptedTypes.join(' 或 ')} 格式的文件`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleStartAnalysis = async () => {
    if (!bidNotice || !controlPrice || !cadFile) {
      toast({
        title: "请完善信息",
        description: "请上传所需文件并输入内部控制价",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    toast({
      title: "开始解析",
      description: "正在解析项目文件，请稍候...",
    });

    try {
      // 模拟文件处理和项目创建过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 生成新项目ID (实际应用中会从服务器返回)
      const newProjectId = Math.floor(Math.random() * 1000) + Date.now();
      
      toast({
        title: "项目创建成功",
        description: `项目已成功创建，文件解析完成`,
      });
      
      // 跳转到新创建的项目详情页
      navigate(`/project/${newProjectId}`);
      
    } catch (error) {
      toast({
        title: "创建失败",
        description: "项目创建过程中出现错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">新建项目</h1>
        <p className="text-muted-foreground">
          用于识别项目城市，建筑类型，中标金额 CAD
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
              <div 
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors"
                onDrop={(e) => handleDrop(e, setBidNotice, ['.pdf'])}
                onDragOver={handleDragOver}
              >
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
              <div 
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors"
                onDrop={(e) => handleDrop(e, setCadFile, ['.dwg'])}
                onDragOver={handleDragOver}
              >
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
              disabled={!bidNotice || !controlPrice || !cadFile || isCreating}
            >
              <Play className="mr-2 h-4 w-4" />
              {isCreating ? "正在创建..." : "开始解析"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}