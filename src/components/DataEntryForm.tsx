
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  description: string;
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
  description,
  showCategorySelector = false,
  category: initialCategory,
  subType: initialSubType
}: DataEntryFormProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "");
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

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const formattedDate = format(values.date, "M/d");
    const finalCategory = showCategorySelector ? selectedCategory : initialCategory;
    const finalSubType = showCategorySelector ? selectedSubType : initialSubType;
    const finalTitle = showCategorySelector 
      ? categorySubTypeMap[finalCategory as keyof typeof categorySubTypeMap]?.subTypes[finalSubType as keyof any]?.name || title
      : title;
    
    onSubmit({
      date: formattedDate,
      value: values.value,
      notes: values.notes,
      category: finalCategory,
      subType: finalSubType,
    });
    
    toast({
      title: "数据录入成功",
      description: `已记录 ${formattedDate} 的${finalTitle}数据：${values.value}${currentUnit}`,
    });
    
    form.reset();
    setSelectedCategory("");
    setSelectedSubType("");
    onOpenChange(false);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubType("");
    setCurrentUnit("");
  };

  const handleSubTypeChange = (value: string) => {
    setSelectedSubType(value);
    if (selectedCategory) {
      const subTypeInfo = categorySubTypeMap[selectedCategory as keyof typeof categorySubTypeMap]?.subTypes[value as keyof any];
      if (subTypeInfo) {
        setCurrentUnit(subTypeInfo.unit);
      }
    }
  };

  const getCurrentSubTypes = () => {
    if (!selectedCategory) return {};
    return categorySubTypeMap[selectedCategory as keyof typeof categorySubTypeMap]?.subTypes || {};
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {showCategorySelector ? "录入监测数据" : `录入${title}数据`}
          </DialogTitle>
          <DialogDescription>
            {showCategorySelector ? "请选择类别和具体类型，然后录入实际监测数据" : description}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {showCategorySelector && (
              <>
                <FormItem>
                  <FormLabel>类别</FormLabel>
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择类别" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categorySubTypeMap).map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>

                {selectedCategory && (
                  <FormItem>
                    <FormLabel>具体类型</FormLabel>
                    <Select value={selectedSubType} onValueChange={handleSubTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择具体类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(getCurrentSubTypes()).map(([key, subType]) => (
                          <SelectItem key={key} value={key}>
                            {(subType as { name: string; unit: string }).name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              </>
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
                      disabled={showCategorySelector && (!selectedCategory || !selectedSubType)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={showCategorySelector && (!selectedCategory || !selectedSubType)}
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
