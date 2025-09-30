
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Craftsman } from "@/types/craftsman";

interface EditCraftsmanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  craftsman: Craftsman | null;
  onSave: (updatedCraftsman: Craftsman) => void;
}

export function EditCraftsmanDialog({ open, onOpenChange, craftsman, onSave }: EditCraftsmanDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Craftsman>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (craftsman) {
      setFormData(craftsman);
    }
  }, [craftsman]);

  const handleSave = async () => {
    if (!craftsman || !formData.name || !formData.trade || !formData.level) {
      toast({
        title: "验证错误",
        description: "请填写所有必需字段",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedCraftsman: Craftsman = {
        ...craftsman,
        ...formData,
        updatedAt: new Date().toISOString(),
      } as Craftsman;

      onSave(updatedCraftsman);
      toast({
        title: "保存成功",
        description: "工匠信息已更新",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof Craftsman, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑工匠信息</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 头像区域 */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={formData.avatar} alt={formData.name} />
              <AvatarFallback>
                {formData.name?.slice(0, 1) || '工'}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              更换头像
            </Button>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="请输入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade">工种 *</Label>
              <Select value={formData.trade || ''} onValueChange={(value) => updateField('trade', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择工种" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="木工">木工</SelectItem>
                  <SelectItem value="电工">电工</SelectItem>
                  <SelectItem value="钢筋工">钢筋工</SelectItem>
                  <SelectItem value="混凝土工">混凝土工</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">等级 *</Label>
              <Select value={formData.level?.toString() || ''} onValueChange={(value) => updateField('level', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择等级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1级</SelectItem>
                  <SelectItem value="2">2级</SelectItem>
                  <SelectItem value="3">3级</SelectItem>
                  <SelectItem value="4">4级</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">性别</Label>
              <Select value={formData.gender || ''} onValueChange={(value) => updateField('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择性别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="男">男</SelectItem>
                  <SelectItem value="女">女</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">年龄</Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ''}
                onChange={(e) => updateField('age', parseInt(e.target.value))}
                placeholder="请输入年龄"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">联系方式</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="请输入联系方式"
              />
            </div>
          </div>

          {/* 个人简介 */}
          <div className="space-y-2">
            <Label htmlFor="bio">个人简介</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="请输入工作经验和技能描述"
              rows={3}
            />
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="remarks">备注</Label>
            <Textarea
              id="remarks"
              value={formData.remarks || ''}
              onChange={(e) => updateField('remarks', e.target.value)}
              placeholder="其他备注信息"
              rows={2}
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
            className="text-primary hover:text-primary hover:bg-primary/10"
            onClick={handleSave} 
            disabled={isLoading}
          >
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
