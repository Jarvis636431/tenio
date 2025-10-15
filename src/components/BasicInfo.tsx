import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Edit, X, FileText, ChevronRight, Building, MapPin, Shield, Wrench, TreePine, File, Upload, Download, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// 移除 Tabs，改用右侧锚点导航
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

interface BasicInfoProps {
  actions?: React.ReactNode;
  onActionsChange?: (actions: React.ReactNode) => void;
}

const basicInfoSchema = z.object({
  city: z.string().min(1, "请选择项目城市"),
  buildingType: z.string().min(1, "请选择建筑类型"),
  structureType: z.string().min(1, "请选择结构类型"),
  bidAmount: z.number().min(0, "中标金额必须大于0"),
  controlPrice: z.number().min(0, "内部控制价必须大于0"),
  buildingHeight: z.number().min(0, "建筑高度必须大于0"),
  buildingFloors: z.number().min(1, "建筑层数必须大于0"),
  buildingArea: z.number().min(0, "建筑面积必须大于0"),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

export default function BasicInfo({ actions, onActionsChange }: BasicInfoProps) {
  const { currentProject, updateProject } = useProject();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedItem, setEditedItem] = useState<BasicInfoFormData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<BasicInfoFormData | null>(null);
  // Tabs 移除，无需 sticky

  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      city: "北京市",
      buildingType: "住宅",
      structureType: "框架结构",
      bidAmount: 0,
      controlPrice: 0,
      buildingHeight: 0,
      buildingFloors: 1,
      buildingArea: 0,
    },
  });

  // 检测表单变化
  const hasChanges = form.formState.isDirty;

  // Tabs 移除，无需置顶监听

  useEffect(() => {
    // 由于 Project 上暂未定义这些字段，这里提供默认值
    const projectData = {
      city: "北京市",
      buildingType: "住宅",
      structureType: "框架结构",
      bidAmount: 0,
      controlPrice: 0,
      buildingHeight: 0,
      buildingFloors: 1,
      buildingArea: 0,
    };
    form.reset(projectData);
    setEditedItem(projectData);
  }, [form]);

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    const projectData = {
      city: "北京市",
      buildingType: "住宅",
      structureType: "框架结构",
      bidAmount: 0,
      controlPrice: 0,
      buildingHeight: 0,
      buildingFloors: 1,
      buildingArea: 0,
    };
    form.reset(projectData);
    setEditedItem(projectData);
  };

  const onSubmit = async (data: BasicInfoFormData) => {
    // 打开二次确认弹窗，由用户选择保存方式
    setPendingData(data);
    setConfirmOpen(true);
  };

  const doSave = (regenerate: boolean) => {
    if (pendingData && currentProject) {
      updateProject({ ...currentProject, ...pendingData });
    }
    setIsEditMode(false);
    setConfirmOpen(false);
    setPendingData(null);
    toast.success(regenerate ? "已保存并将重新生成施工工序" : "已保存修改");
    if (regenerate) {
      // TODO: 在此触发真实的重新生成逻辑
      console.info('Regenerate construction procedures requested');
    }
  };

  const handleRegenerateProcedures = () => {
    // 触发重新生成工序的逻辑
    toast.success("正在重新生成施工工序...");
    // TODO: 在此触发真实的重新生成逻辑
    console.info('Regenerate construction procedures requested');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 渲染操作按钮
  const renderActions = () => {
    if (actions) return actions;
    
    return !isEditMode ? (
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          className="text-primary hover:text-primary hover:bg-primary/10"
          onClick={handleEdit} 
          size="sm"
        >
          编辑
        </Button>
        <Button 
          variant="ghost" 
          className="text-primary hover:text-primary hover:bg-primary/10"
          onClick={handleRegenerateProcedures} 
          size="sm"
        >
          重新生成工序
        </Button>
      </div>
    ) : (
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="ghost" 
          className="text-primary hover:text-primary hover:bg-primary/10"
          onClick={handleCancel} 
          size="sm"
        >
          取消
        </Button>
        <Button 
          type="submit" 
          variant="ghost" 
          className="text-primary hover:text-primary hover:bg-primary/10"
          size="sm" 
          disabled={!hasChanges} 
          onClick={form.handleSubmit(onSubmit)}
        >
          保存
        </Button>
      </div>
    );
  };

  // 当编辑状态改变时，通知父组件更新操作按钮
  useEffect(() => {
    if (onActionsChange) {
      onActionsChange(renderActions());
    }
  }, [isEditMode, hasChanges, onActionsChange]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto">
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-6">
            {/* 左侧锚点导航 */}
            <aside className="hidden lg:block w-48 flex-shrink-0">
              <div className="sticky top-16 border-l pl-3">
                <nav className="space-y-2">
                  <a href="#basic" className="block text-sm text-muted-foreground hover:text-primary">一、基本信息</a>
                  <a href="#technical" className="block text-sm text-muted-foreground hover:text-primary">二、技术规格</a>
                  <a href="#safety" className="block text-sm text-muted-foreground hover:text-primary">三、安全防护</a>
                  <a href="#environment" className="block text-sm text-muted-foreground hover:text-primary">四、环境条件</a>
                </nav>
              </div>
            </aside>

            <div className="flex-1 min-w-0 space-y-10">
              {/* 基本信息 */}
              <div className="space-y-6" id="basic">
                <h3 className="text-lg font-semibold text-foreground">一、基本信息</h3>
                <div id="basic"></div>
                <div className="border rounded-lg">
                  <div className="flex items-center gap-2 p-4 border-b">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">基本信息</span>
                  </div>
                  <div className="p-6">
                    {isEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>项目城市</FormLabel>
                              <FormControl>
                                <Input placeholder="请输入项目城市" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buildingType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>建筑类型</FormLabel>
                              <FormControl>
                                <Input placeholder="如 住宅/商业/综合体" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="structureType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>结构类型</FormLabel>
                              <FormControl>
                                <Input placeholder="如 框架结构/剪力墙" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bidAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>中标金额（万元）</FormLabel>
                              <FormControl>
                                <Input type="number" inputMode="decimal" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="controlPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>内部控制价（万元）</FormLabel>
                              <FormControl>
                                <Input type="number" inputMode="decimal" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buildingHeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>建筑高度（米）</FormLabel>
                              <FormControl>
                                <Input type="number" inputMode="decimal" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buildingFloors"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>建筑层数（层）</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value || '0', 10))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buildingArea"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>建筑面积（㎡）</FormLabel>
                              <FormControl>
                                <Input type="number" inputMode="decimal" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">项目名称</label>
                          <div className="text-sm text-foreground">石钢旧厂区一期地块（居住地块一）12#</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">建设地点</label>
                          <div className="text-sm text-foreground">河北省石家庄市</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">建筑类型</label>
                          <div className="text-sm text-foreground">居住建筑群，包含多层住宅（6层）、小高层住宅（11层）、高层住宅（18层、26层、33层）</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">绿色建筑等级</label>
                          <div className="text-sm text-foreground">二星级</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Collapsible defaultOpen>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">位置规模</span>
                      </div>
                      <ChevronUp className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold">项目位置</h4>
                      {isEditMode ? (
                        <Textarea defaultValue="位于石家庄市长安区，地处石钢旧厂区核心区域，北临体育北大街，南接和平东路，西靠谈固北大街，东依建华大街。距离地铁2号线某站点约800米，公交线路涵盖1路、5路、21路等10余条" rows={3} />
                      ) : (
                        <div className="text-sm text-foreground">
                          位于石家庄市长安区，地处石钢旧厂区核心区域，北临体育北大街，南接和平东路，西靠谈固北大街，东依建华大街。距离地铁2号线某站点约800米，公交线路涵盖1路、5路、21路等10余条
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">项目规模</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">总占地面积</label>
                        {isEditMode ? (
                          <Input defaultValue="约85,600平方米" />
                        ) : (
                          <div className="text-sm text-foreground">约85,600平方米</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">总建筑面积</label>
                        {isEditMode ? (
                          <Input defaultValue="约286,000平方米" />
                        ) : (
                          <div className="text-sm text-foreground">约286,000平方米</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">地上建筑面积</label>
                        {isEditMode ? (
                          <Input defaultValue="228,000平方米" />
                        ) : (
                          <div className="text-sm text-foreground">228,000平方米</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">地下建筑面积</label>
                        {isEditMode ? (
                          <Input defaultValue="58,000平方米" />
                        ) : (
                          <div className="text-sm text-foreground">58,000平方米</div>
                        )}
                      </div>
                    </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">建筑高度</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        ["多层住宅","18.5米"],
                        ["小高层住宅","33.8米"],
                        ["18层高层住宅","54.6米"],
                        ["26层高层住宅","78.3米"],
                        ["33层高层住宅","99.6米"],
                      ].map(([label, value]) => (
                        <div className="space-y-2" key={label}>
                          <label className="text-sm font-medium">{label}</label>
                          {isEditMode ? (
                            <Input defaultValue={value} />
                          ) : (
                            <div className="text-sm text-foreground">{value}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </div>

              {/* 技术规格 */}
              <div className="space-y-6" id="technical">
                <h3 className="text-lg font-semibold text-foreground">二、技术规格</h3>
                <div id="technical"></div>
                <Collapsible defaultOpen>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        <span className="font-medium">结构工程</span>
                      </div>
                      <ChevronUp className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold">结构体系</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        ["结构形式","剪力墙"],
                        ["结构体系","剪力墙结构体系"],
                        ["建筑结构安全等级","二级"],
                        ["正负零高程","83.50米（相对于1985国家高程基准）"],
                      ].map(([label, value]) => (
                        <div className="space-y-2" key={label}>
                          <label className="text-sm font-medium">{label}</label>
                          {isEditMode ? (
                            <Input defaultValue={value} />
                          ) : (
                            <div className="text-sm text-foreground">{value}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">基础形式</h4>
                    {isEditMode ? (
                      <Textarea rows={3} defaultValue="钢筋混凝土桩筏基础，桩基为钻孔灌注桩（直径600mm，有效桩长28米，单桩竖向承载力特征值3000kN，桩端进入第⑦层粉质黏土层，桩身混凝土强度等级C35），筏板厚度为1200mm，混凝土强度等级C35P6" />
                    ) : (
                      <div className="text-sm text-foreground">
                        钢筋混凝土桩筏基础，桩基为钻孔灌注桩（直径600mm，有效桩长28米，单桩竖向承载力特征值3000kN，桩端进入第⑦层粉质黏土层，桩身混凝土强度等级C35），筏板厚度为1200mm，混凝土强度等级C35P6
                      </div>
                    )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">装配式预制构件</h4>
                    {isEditMode ? (
                      <Textarea rows={2} defaultValue="60mm厚预制叠合楼板（现浇层厚度70mm，总厚度130mm）、预制楼梯（厚度180mm）、预制阳台板（厚度120mm）、预制空调板（厚度100mm）" />
                    ) : (
                      <div className="text-sm text-foreground">60mm厚预制叠合楼板（现浇层厚度70mm，总厚度130mm）、预制楼梯（厚度180mm）、预制阳台板（厚度120mm）、预制空调板（厚度100mm）</div>
                    )}
                    </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </div>

              {/* 安全防护 */}
              <div className="space-y-6" id="safety">
                <h3 className="text-lg font-semibold text-foreground">三、安全防护</h3>
                <div id="safety"></div>
                <Collapsible defaultOpen>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">抗震设防</span>
                      </div>
                      <ChevronUp className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">抗震设防烈度</label>
                        {isEditMode ? (
                          <Input defaultValue="7度（设计基本地震加速度值为0.15g，设计地震分组为第二组）" />
                        ) : (
                          <div className="text-sm text-foreground">7度（设计基本地震加速度值为0.15g，设计地震分组为第二组）</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">抗震等级</label>
                        {isEditMode ? (
                          <Input defaultValue="18层及以下建筑为三级，26层建筑为二级，33层建筑为一级" />
                        ) : (
                          <div className="text-sm text-foreground">18层及以下建筑为三级，26层建筑为二级，33层建筑为一级</div>
                        )}
                      </div>
                    </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                <Collapsible defaultOpen>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">人防工程</span>
                      </div>
                      <ChevronUp className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">人防类别</label>
                        {isEditMode ? (<Input defaultValue="甲类防空地下室" />) : (<div className="text-sm text-foreground">甲类防空地下室</div>)}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">人防等级</label>
                        {isEditMode ? (<Input defaultValue="核6级、常6级" />) : (<div className="text-sm text-foreground">核6级、常6级</div>)}
                      </div>
                    </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                <Collapsible defaultOpen>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        <span className="font-medium">基坑工程</span>
                      </div>
                      <ChevronUp className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">地下两层区域</label>
                        {isEditMode ? (<Input defaultValue="开挖深度9.8米" />) : (<div className="text-sm text-foreground">开挖深度9.8米</div>)}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">地下一层区域</label>
                        {isEditMode ? (<Input defaultValue="开挖深度5.6米" />) : (<div className="text-sm text-foreground">开挖深度5.6米</div>)}
                      </div>
                    </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </div>

              {/* 环境条件 */}
              <div className="space-y-6" id="environment">
                <h3 className="text-lg font-semibold text-foreground">四、环境条件</h3>
                <div id="environment"></div>
                <Collapsible defaultOpen>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <TreePine className="h-4 w-4" />
                        <span className="font-medium">自然条件</span>
                      </div>
                      <ChevronUp className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 space-y-4">
                    {isEditMode ? (
                      <Textarea rows={3} defaultValue="石家庄市属温带季风气候，年均气温14.2℃，极端最高气温42.9℃，极端最低气温-19.8℃；年均降水量569.8mm，降水集中在7-8月，占全年降水量的60%以上；年均风速1.8m/s，主导风向为东北风；最大冻土深度0.5m，基本雪压0.35kN/㎡，基本风压0.45kN/㎡" />
                    ) : (
                      <div className="text-sm text-foreground">石家庄市属温带季风气候，年均气温14.2℃，极端最高气温42.9℃，极端最低气温-19.8℃；年均降水量569.8mm，降水集中在7-8月，占全年降水量的60%以上；年均风速1.8m/s，主导风向为东北风；最大冻土深度0.5m，基本雪压0.35kN/㎡，基本风压0.45kN/㎡</div>
                    )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                <Collapsible defaultOpen>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        <span className="font-medium">地质条件</span>
                      </div>
                      <ChevronUp className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 space-y-4">
                    {isEditMode ? (
                      <Textarea rows={3} defaultValue="场地地层自上而下依次为①素填土（厚度1.5-3.0m，松散）、②粉质黏土（厚度2.0-4.0m，可塑）、③粉土（厚度1.5-3.0m，稍密）、④粉质黏土（厚度3.0-5.0m，硬塑）、⑤粉砂（厚度2.0-3.5m，中密）、⑥粉质黏土（厚度4.0-6.0m，硬塑）、⑦粉质黏土（厚度大于5.0m，坚硬）。地下水位埋深8.5-10.0m，地下水类型为潜水，主要受大气降水补给，年变幅1.5-2.0m，地下水对混凝土结构具微腐蚀性，对钢筋混凝土结构中钢筋具微腐蚀性" />
                    ) : (
                      <div className="text-sm text-foreground">场地地层自上而下依次为①素填土（厚度1.5-3.0m，松散）、②粉质黏土（厚度2.0-4.0m，可塑）、③粉土（厚度1.5-3.0m，稍密）、④粉质黏土（厚度3.0-5.0m，硬塑）、⑤粉砂（厚度2.0-3.5m，中密）、⑥粉质黏土（厚度4.0-6.0m，硬塑）、⑦粉质黏土（厚度大于5.0m，坚硬）。地下水位埋深8.5-10.0m，地下水类型为潜水，主要受大气降水补给，年变幅1.5-2.0m，地下水对混凝土结构具微腐蚀性，对钢筋混凝土结构中钢筋具微腐蚀性</div>
                    )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                <Collapsible defaultOpen>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="font-medium">保温工程</span>
                      </div>
                      <ChevronUp className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">外保温形式</label>
                        {isEditMode ? (<Input defaultValue="粘贴+锚栓固定的外墙外保温形式" />) : (<div className="text-sm text-foreground">粘贴+锚栓固定的外墙外保温形式</div>)}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">外保温材质及厚度</label>
                        {isEditMode ? (<Input defaultValue="模塑聚苯乙烯泡沫板（EPS），厚度60mm" />) : (<div className="text-sm text-foreground">模塑聚苯乙烯泡沫板（EPS），厚度60mm</div>)}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">外保温防火等级</label>
                        {isEditMode ? (<Input defaultValue="B1级，每层楼板处设置300mm高防火隔离带" />) : (<div className="text-sm text-foreground">B1级，每层楼板处设置300mm高防火隔离带</div>)}
                      </div>
                    </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </div>
            </div>
          </form>
        </Form>
        {/* 保存二次确认 */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>是否根据新的内容重新生成施工工序？</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => doSave(false)}>仅保存</Button>
              <Button onClick={() => doSave(true)}>保存并重新生成</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
          </div>
  );
}