import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanOverview } from "@/components/PlanOverview";
import { OrderManagement } from "@/components/OrderManagement";

interface PlanAndOrdersProps {
  showExpandButton?: boolean;
  onExpandSidebar?: () => void;
}

export function PlanAndOrders(props: PlanAndOrdersProps) {
  return (
    <div className="h-full">
      <Tabs defaultValue="plan" className="h-full">
        <div className="px-4 pt-4">
          <TabsList>
            <TabsTrigger value="plan">计划总览</TabsTrigger>
            <TabsTrigger value="orders">订单管理</TabsTrigger>
          </TabsList>
        </div>
        <div className="h-[calc(100%-48px)] overflow-auto">
          <TabsContent value="plan" className="h-full m-0">
            <PlanOverview {...props} />
          </TabsContent>
          <TabsContent value="orders" className="h-full m-0">
            <OrderManagement {...props} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}


