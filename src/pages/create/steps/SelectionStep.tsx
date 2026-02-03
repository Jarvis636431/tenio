import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { CreateProjectContextType } from "@/types/create-project";
import { planChartData, planOptions } from "@/mocks/data/create-project";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { selectProjectSolution } from "@/services/schedulepro-service";

export function SelectionStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const { selectedPlan, setSelectedPlan, projectId, setSolutionData } =
    useOutletContext<CreateProjectContextType>();

  const defaultPlanId =
    planOptions.find((plan) => plan.tag === "推荐")?.id ?? planOptions[0]?.id;

  useEffect(() => {
    if (!selectedPlan && defaultPlanId) {
      setSelectedPlan(defaultPlanId);
    }
  }, [selectedPlan, defaultPlanId, setSelectedPlan]);

  const onBack = () => {
    navigate("/create/confirm");
  };

  const onNext = async () => {
    if (!projectId) {
      toast({
        title: "缺少项目ID",
        description: "请先完成创建项目步骤。",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "未登录",
        description: "请先登录后再选择方案。",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await selectProjectSolution(
        projectId,
        { solution_id: 0 },
        token,
      );
      const resolved =
        (response as { data?: typeof response }).data ?? response;
      setSolutionData(resolved);
      navigate("/create/preview");
    } catch (error) {
      toast({
        title: "方案选择失败",
        description:
          error instanceof Error ? error.message : "请稍后再试",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 w-full h-full flex flex-col p-6">
      <div className="bg-gray-50/50 rounded-xl p-6 flex-1 min-h-[340px] relative">
        <div className="absolute top-4 left-6 text-sm text-gray-400">
          累计总成本（万元）
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
          <div className="text-xl font-medium text-gray-800">方案对比</div>
          <div className="text-sm text-gray-400">总天数 vs 总成本</div>
        </div>
        <div className="absolute bottom-2 right-6 text-sm text-gray-400">
          累计总天数
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={planChartData}
            margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              vertical={true}
              horizontal={false}
              strokeDasharray="3 3"
              stroke="#eee"
            />
            <XAxis dataKey="day" type="number" domain={["dataMin", "dataMax"]} hide />
            <YAxis hide domain={[5100, "dataMax + 50"]} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [`${value}万元`, "成本"]}
              labelFormatter={(label) => `${label}天`}
            />
            {/* 模拟选中区域 */}
            <ReferenceArea
              x1={260}
              x2={300}
              strokeOpacity={0}
              fill="#fee2e2"
              fillOpacity={0.5}
            />
            <ReferenceLine x={293} stroke="#ef4444" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="cost"
              stroke="#93c5fd"
              strokeWidth={4}
              dot={{
                r: 4,
                fill: "white",
                stroke: "#93c5fd",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "#3b82f6",
                stroke: "white",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-7 gap-3 h-[150px]">
        {planOptions.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 h-full flex flex-col justify-between shadow-sm ${
              selectedPlan === plan.id
                ? "border-yellow-400 bg-yellow-50/30"
                : "border-transparent bg-gray-50 hover:bg-gray-100"
            }`}
          >
            {plan.tag && (
              <div
                className={`absolute top-0 right-0 ${plan.tagColor} text-white text-sm px-3 py-1 rounded-bl-lg rounded-tr-md shadow-sm`}
              >
                {plan.tag}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-bold text-base text-gray-900">{plan.title}</h3>
            </div>

            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_auto] items-center text-sm">
                <span className="text-gray-900 font-semibold text-sm">
                  {plan.totalDays} 天
                </span>
                <div className="flex items-center justify-end gap-2 text-right">
                  <span className="text-[10px] text-gray-400">累计总天数</span>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center text-sm">
                <span className="text-gray-900 font-semibold text-sm">
                  {(plan.totalCost / 10000).toFixed(2)} 万元
                </span>
                <div className="flex items-center justify-end gap-2 text-right">
                  <span className="text-[10px] text-gray-400">累计总成本</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-6 pt-2 pb-2 shrink-0">
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-32 h-12 text-base font-medium text-[#1975D2] hover:text-[#1564b3] hover:bg-blue-50 bg-gray-50 rounded-lg"
        >
          返回上一步
        </Button>
        <Button
          onClick={onNext}
          className="w-56 h-12 text-base font-medium bg-[#1975D2] hover:bg-[#1564b3] shadow-lg shadow-blue-200 rounded-lg"
        >
          开始分析
        </Button>
      </div>
    </div>
  );
}
