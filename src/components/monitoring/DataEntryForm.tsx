
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  date: z.date({
    required_error: "请选择日期",
  }),
  value: z.number({
    required_error: "请输入实际值",
  }).min(0, "实际值不能为负数"),
  notes: z.string().optional(),
  category: z.string().optional(),
  subType: z.string().optional(),
});

// 类别到子类型的映射
const categorySubTypeMap = {
  materials: {
    name: "物料供应",
    subTypes: {
      concrete_c15: { name: "C15混凝土", unit: "m³" },
      concrete_c20: { name: "C20混凝土", unit: "m³" },
      concrete_c25: { name: "C25混凝土", unit: "m³" },
      steel_d12: { name: "钢筋D12", unit: "t" },
      steel_d16: { name: "钢筋D16", unit: "t" },
      steel_d18: { name: "钢筋D18", unit: "t" },
      blocks: { name: "空心混凝土砌块", unit: "m²" },
      mortar: { name: "砂浆", unit: "m³" }
    }
  },
  labor: {
    name: "劳动力配置",
    subTypes: {
      carpenter: { name: "木工", unit: "人" },
      steelworker: { name: "钢筋工", unit: "人" },
      concreter: { name: "混凝土工", unit: "人" },
      electrician: { name: "电工", unit: "人" }
    }
  },
  funding: {
    name: "资金使用",
    subTypes: {
      total: { name: "总资金", unit: "元" },
      labor_cost: { name: "人工费用", unit: "元" },
      material_cost: { name: "材料费用", unit: "元" },
      equipment_cost: { name: "设备费用", unit: "元" },
      management_cost: { name: "管理费用", unit: "元" }
    }
  },
  procurement: {
    name: "采购进度",
    subTypes: {
      materials: { name: "材料采购", unit: "元" },
      equipment: { name: "设备采购", unit: "元" },
      subcontract: { name: "分包采购", unit: "元" },
      orders: { name: "订单管理", unit: "元" }
    }
  }
};

interface DataEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { 
    date: string; 
    value: number; 
    notes?: string;
    category?: string;
    subType?: string;
  }) => void;
  title: string;
  unit: string;
  showCategorySelector?: boolean;
  category?: string;
  subType?: string;
}

export function DataEntryForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  title, 
  unit, 
  showCategorySelector = false,
  category: initialCategory,
  subType: initialSubType
}: DataEntryFormProps) {
  const { toast } = useToast();
  const [selectedSubType, setSelectedSubType] = useState<string>(initialSubType || "");
  const [currentUnit, setCurrentUnit] = useState<string>(unit);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      notes: "",
      category: initialCategory,
      subType: initialSubType,
    },
  });

  // 劳动力录入：分工种多行输入（不受筛选影响）
  const [laborRows, setLaborRows] = useState<Array<{ jobType: string; count: number }>>([
    { jobType: "", count: 0 }
  ]);

  const allJobTypes = [
    "钢筋工", "混凝土工", "木工", "测量员", "土方工",
    "砌筑工", "抹灰工", "防水工", "水电工", "油漆工",
    "油工", "瓦工", "不限"
  ];

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const formattedDate = format(values.date, "M/d");
    const finalCategory = initialCategory;
    const finalSubType = showCategorySelector ? selectedSubType : initialSubType;
    const finalTitle = showCategorySelector && finalSubType && initialCategory
      ? categorySubTypeMap[initialCategory as keyof typeof categorySubTypeMap]?.subTypes[finalSubType as keyof any]?.name || title
      : title;

    // 如果是劳动力录入，则按分工种累加总人数，并把明细写入备注
    if (initialCategory === 'labor') {
      const cleaned = laborRows.filter(r => r.jobType && r.count > 0);
      const total = cleaned.reduce((sum, r) => sum + r.count, 0);
      const detailNote = cleaned.length > 0 ? `分工种明细: ${cleaned.map(r => `${r.jobType} ${r.count}人`).join('；')}` : '';
      onSubmit({
        date: formattedDate,
        value: total,
        notes: [detailNote, values.notes || ''].filter(Boolean).join('\n'),
        category: finalCategory,
        subType: finalSubType,
      });
    } else {
      onSubmit({
        date: formattedDate,
        value: values.value,
        notes: values.notes,
        category: finalCategory,
        subType: finalSubType,
      });
    }
    
    toast({
      title: "数据录入成功",
      description: initialCategory === 'labor'
        ? `已记录 ${formattedDate} 的劳动力数据：合计 ${laborRows.reduce((s, r) => s + (r.count || 0), 0)}人`
        : `已记录 ${formattedDate} 的${finalTitle}数据：${values.value}${currentUnit}`,
    });
    
    form.reset();
    setSelectedSubType("");
    setLaborRows([{ jobType: "", count: 0 }]);
    onOpenChange(false);
  };

  const handleSubTypeChange = (value: string) => {
    setSelectedSubType(value);
    if (initialCategory) {
      const subTypeInfo = categorySubTypeMap[initialCategory as keyof typeof categorySubTypeMap]?.subTypes[value as keyof any];
      if (subTypeInfo) {
        setCurrentUnit(subTypeInfo.unit);
      }
    }
  };

  const getCurrentSubTypes = () => {
    if (!initialCategory) return {};
    return categorySubTypeMap[initialCategory as keyof typeof categorySubTypeMap]?.subTypes || {};
  };

  const getCategoryName = () => {
    if (!initialCategory) return "";
    return categorySubTypeMap[initialCategory as keyof typeof categorySubTypeMap]?.name || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {initialCategory === 'labor' ? '施工人数录入' : initialCategory === 'cost' ? '人工成本录入' : (showCategorySelector ? `录入${getCategoryName()}数据` : `录入${title}数据`)}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {showCategorySelector && initialCategory && (
              <FormItem>
                <FormLabel>具体类型</FormLabel>
                <Select value={selectedSubType} onValueChange={handleSubTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择具体类型" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {Object.entries(getCurrentSubTypes()).map(([key, subType]) => (
                      <SelectItem key={key} value={key}>
                        {(subType as { name: string; unit: string }).name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>日期</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "yyyy年MM月dd日")
                          ) : (
                            <span>选择日期</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {initialCategory === 'labor' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>分工种录入</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={() => setLaborRows([...laborRows, { jobType: "", count: 0 }])}>添加工种</Button>
                </div>
                {laborRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-7">
                      <Select value={row.jobType} onValueChange={(v) => {
                        const next = [...laborRows];
                        next[idx].jobType = v;
                        setLaborRows(next);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择工种" />
                        </SelectTrigger>
                        <SelectContent>
                          {allJobTypes.map((jt) => (
                            <SelectItem key={jt} value={jt}>{jt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Input type="number" min="0" placeholder="人数"
                        value={row.count}
                        onChange={(e) => {
                          const val = parseInt(e.target.value || '0', 10);
                          const next = [...laborRows];
                          next[idx].count = isNaN(val) ? 0 : val;
                          setLaborRows(next);
                        }}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {laborRows.length > 1 && (
                        <Button type="button" variant="ghost" onClick={() => setLaborRows(laborRows.filter((_, i) => i !== idx))}>×</Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground">总人数：{laborRows.reduce((s, r) => s + (r.count || 0), 0)} 人</div>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      实际值 ({showCategorySelector && selectedSubType ? currentUnit : unit})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={`请输入实际值`}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={showCategorySelector && !selectedSubType}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注 (可选)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="添加备注信息..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    可以添加相关说明或注意事项
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button 
                type="submit"
                disabled={showCategorySelector && !selectedSubType}
              >
                确认录入
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
