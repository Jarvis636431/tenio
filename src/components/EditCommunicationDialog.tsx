
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommunicationRecord } from "@/types/communication";

interface EditCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CommunicationRecord;
  onEdit: (record: CommunicationRecord) => void;
}

export function EditCommunicationDialog({ open, onOpenChange, record, onEdit }: EditCommunicationDialogProps) {
  const [formData, setFormData] = useState({
    date: record.date,
    coordinationType: record.coordinationType,
    content: record.content
  });

  useEffect(() => {
    setFormData({
      date: record.date,
      coordinationType: record.coordinationType,
      content: record.content
    });
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.coordinationType || !formData.content.trim()) return;

    onEdit({
      ...record,
      date: formData.date,
      coordinationType: formData.coordinationType as CommunicationRecord['coordinationType'],
      content: formData.content.trim()
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑沟通协作记录</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">日期</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-coordinationType">协调类型</Label>
              <Select
                value={formData.coordinationType}
                onValueChange={(value) => setFormData({ ...formData, coordinationType: value as CommunicationRecord['coordinationType'] })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择协调类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="设计协同">设计协同</SelectItem>
                  <SelectItem value="施工协同">施工协同</SelectItem>
                  <SelectItem value="建立协同">建立协同</SelectItem>
                  <SelectItem value="建设方协同">建设方协同</SelectItem>
                  <SelectItem value="监管部门协同">监管部门协同</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-content">沟通内容</Label>
            <Textarea
              id="edit-content"
              placeholder="请描述沟通协调的具体内容..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">保存更改</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
