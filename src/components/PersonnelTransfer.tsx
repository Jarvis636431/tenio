import { Card } from "@/components/ui/card";

interface PersonnelTransferProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

export function PersonnelTransfer({
  showExpandButton = false,
  onExpandSidebar,
}: PersonnelTransferProps) {
  return (
    <div className="h-full flex flex-col space-y-6">
      <Card className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">人员流转</h3>
          <p className="text-sm">功能开发中...</p>
        </div>
      </Card>
    </div>
  );
}
