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
        <div className="absolute top-4 left-6 text-sm text-gray-400">成本</div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
          <div className="text-xl font-medium text-gray-800">18个月</div>
          <div className="text-sm text-gray-400">工期上限</div>
        </div>
        <div className="absolute bottom-2 right-6 text-sm text-gray-400">
          工期时间
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
            <XAxis
              dataKey="month"
              type="number"
              domain={["dataMin", "dataMax"]}
              hide
            />
            <YAxis hide domain={["dataMin - 500", "dataMax + 500"]} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [`${value}万元`, "成本"]}
              labelFormatter={(label) => `${label}个月`}
            />
            {/* 模拟选中区域 */}
            <ReferenceArea
              x1={16}
              x2={20}
              strokeOpacity={0}
              fill="#fee2e2"
              fillOpacity={0.5}
            />
            <ReferenceLine x={18} stroke="#ef4444" strokeDasharray="3 3" />
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

      <div className="grid grid-cols-4 gap-4 h-[160px]">
        {planOptions.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 h-full flex flex-col justify-between shadow-sm ${
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

            <div className="space-y-4">
              <h3 className="font-bold text-xl text-gray-900">{plan.title}</h3>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto] items-center text-base">
                <span className="text-gray-900 font-semibold text-lg">
                  {plan.endDate}
                </span>
                <div className="flex items-center justify-end gap-2 text-right">
                  <span className="text-xs text-gray-400">预期结束日期</span>
                  {plan.durationTag && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">
                      {plan.durationTag}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center text-base">
                <span className="text-gray-900 font-semibold text-lg">
                  {plan.cost}
                </span>
                <div className="flex items-center justify-end gap-2 text-right">
                  <span className="text-xs text-gray-400">预期建设成本</span>
                  {plan.costTag && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">
                      {plan.costTag}
                    </span>
                  )}
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
