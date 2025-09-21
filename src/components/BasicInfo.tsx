import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Edit, X, FileText, ChevronRight } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
const basicInfoSchema = z.object({
  city: z.string().min(1, "请选择项目城市"),
  buildingType: z.string().min(1, "请选择建筑类型"),
  structureType: z.string().min(1, "请选择结构类型"),
  bidAmount: z.number().min(0, "中标金额必须大于0"),
  controlPrice: z.number().min(0, "内部控制价必须大于0"),
  buildingHeight: z.number().min(0, "建筑高度必须大于0"),
  buildingFloors: z.number().min(1, "建筑层数必须大于0"),
  buildingArea: z.number().min(0, "建筑面积必须大于0")
});
type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  parsed: boolean;
}
interface BasicInfoProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}
const defaultFormValues = {
  city: "上海市",
  buildingType: "办公楼",
  structureType: "框架结构",
  bidAmount: 25000000,
  controlPrice: 23500000,
  buildingHeight: 80.5,
  buildingFloors: 18,
  buildingArea: 15000
};
export function BasicInfo({
  showExpandButton = false,
  onExpandSidebar
}: BasicInfoProps) {
  const { currentProject } = useProject();
  const computeProjectDefaults = (): BasicInfoFormData => (
    currentProject?.id === "2"
      ? {
          city: "深圳市",
          buildingType: "学校",
          structureType: "框架剪力墙结构",
          bidAmount: 16800000,
          controlPrice: 15900000,
          buildingHeight: 24.0,
          buildingFloors: 6,
          buildingArea: 8200,
        }
      : defaultFormValues
  );

  const initialDefaults = computeProjectDefaults();
  const [savedValues, setSavedValues] = useState<BasicInfoFormData>(initialDefaults);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([{
    id: "1",
    name: "中标通知书.pdf",
    size: 2048000,
    type: "application/pdf",
    uploadDate: "2024-01-15",
    parsed: true
  }, {
    id: "2",
    name: "建筑图纸.dwg",
    size: 5120000,
    type: "application/dwg",
    uploadDate: "2024-01-15",
    parsed: true
  }]);
  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: initialDefaults
  });
  // 当切换项目时，重置为对应项目的默认值
  useEffect(() => {
    const nextDefaults = computeProjectDefaults();
    setSavedValues(nextDefaults);
    form.reset(nextDefaults);
    setHasChanges(false);
  }, [currentProject?.id]);

  // Watch form values to detect changes
  const watchedValues = form.watch();
  useEffect(() => {
    const currentValues = form.getValues();
    const hasFormChanges = JSON.stringify(currentValues) !== JSON.stringify(savedValues);
    setHasChanges(hasFormChanges);
  }, [watchedValues, savedValues]);
  const onSubmit = (data: BasicInfoFormData) => {
    console.log("保存基础信息:", data);
    setSavedValues(data);
    setHasChanges(false);
    setIsEditMode(false);
    toast.success("项目基础信息已保存");
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    form.reset(savedValues);
    setHasChanges(false);
    setIsEditMode(false);
  };

  // 渲染只读字段的辅助函数
  const renderReadOnlyField = (value: any) => (
    <div className="px-3 py-2 border rounded-md bg-muted/50 text-sm">
      {value}
    </div>
  );
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success("文件已删除");
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  return <div className="h-full overflow-auto space-y-6">

      {/* 项目基础信息 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">项目基础信息</CardTitle>
          {!isEditMode ? (
            <Button onClick={handleEdit} size="sm">
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} size="sm">
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
              <Button type="submit" size="sm" disabled={!hasChanges} onClick={form.handleSubmit(onSubmit)}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4">
                <FormField control={form.control} name="city" render={({
                field
              }) => <FormItem>
                      <FormLabel>项目城市</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="font-medium">
                              <SelectValue placeholder="选择城市" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="北京市">北京市</SelectItem>
                              <SelectItem value="上海市">上海市</SelectItem>
                              <SelectItem value="广州市">广州市</SelectItem>
                              <SelectItem value="深圳市">深圳市</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="px-3 py-2 border rounded-md bg-muted/50 text-sm">
                            {field.value}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="buildingType" render={({
                field
              }) => <FormItem>
                      <FormLabel>建筑类型</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择建筑类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="住宅">住宅</SelectItem>
                              <SelectItem value="办公楼">办公楼</SelectItem>
                              <SelectItem value="商业建筑">商业建筑</SelectItem>
                              <SelectItem value="工业建筑">工业建筑</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="px-3 py-2 border rounded-md bg-muted/50 text-sm">
                            {field.value}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="structureType" render={({
                field
              }) => <FormItem>
                      <FormLabel>结构类型</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择结构类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="框架结构">框架结构</SelectItem>
                              <SelectItem value="剪力墙结构">剪力墙结构</SelectItem>
                              <SelectItem value="框架剪力墙结构">框架剪力墙结构</SelectItem>
                              <SelectItem value="钢结构">钢结构</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          renderReadOnlyField(field.value)
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="bidAmount" render={({
                field
              }) => <FormItem>
                      <FormLabel>中标金额 (万元)</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        ) : (
                          renderReadOnlyField(field.value)
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="controlPrice" render={({
                field
              }) => <FormItem>
                      <FormLabel>内部控制价 (万元)</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        ) : (
                          renderReadOnlyField(field.value)
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="buildingHeight" render={({
                field
              }) => <FormItem>
                      <FormLabel>建筑高度 (米)</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        ) : (
                          renderReadOnlyField(field.value)
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="buildingFloors" render={({
                field
              }) => <FormItem>
                      <FormLabel>建筑层数</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        ) : (
                          renderReadOnlyField(field.value)
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="buildingArea" render={({
                field
              }) => <FormItem>
                      <FormLabel>建筑面积 (平方米)</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        ) : (
                          renderReadOnlyField(field.value)
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>

            </form>
          </Form>


        </CardContent>
      </Card>

      {/* 项目文件 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">项目文件</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-4">
            {uploadedFiles.map(file => <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-normal">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {file.uploadDate} • 
                      <span className={file.parsed ? "text-green-600" : "text-yellow-600"}>
                        {file.parsed ? " 已解析" : " 解析中"}
                      </span>
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toast.info("查看文件功能开发中")}>
                  查看
                </Button>
              </div>)}
          </div>
        </CardContent>
      </Card>
    </div>;
}