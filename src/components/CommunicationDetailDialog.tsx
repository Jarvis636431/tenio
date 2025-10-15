
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CommunicationRecord, coordinationTypeColors } from "@/types/communication";
import { FileText, Image } from "lucide-react";

interface CommunicationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CommunicationRecord;
}

export function CommunicationDetailDialog({ open, onOpenChange, record }: CommunicationDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>沟通协作记录详情</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">日期</Label>
              <p className="text-sm">{record.date}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">协调类型</Label>
              <Badge className={coordinationTypeColors[record.coordinationType]}>
                {record.coordinationType}
              </Badge>
            </div>
          </div>

          {/* 沟通内容 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">沟通内容</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm leading-relaxed">{record.content}</p>
            </div>
          </div>

          {/* 附件列表 */}
          {record.attachments && record.attachments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">附件</Label>
              <div className="grid grid-cols-2 gap-3">
                {record.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    {attachment.type === 'image' ? (
                      <Image className="h-6 w-6 text-category-blue-600" />
                    ) : (
                      <FileText className="h-6 w-6 text-gray-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">{attachment.type === 'image' ? '图片' : '文档'}</p>
                    </div>
                    {attachment.type === 'image' && (
                      <div className="w-12 h-12 bg-muted rounded border overflow-hidden">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 记录信息 */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="text-sm font-medium">创建人</Label>
              <p className="text-sm text-muted-foreground">{record.createdBy}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">最后更新</Label>
              <p className="text-sm text-muted-foreground">{record.updatedAt}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
