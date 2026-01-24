import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Process {
  id: string;
  title: string;
  details: string[];
}

interface DetailChartData {
  month: string;
  value: number;
  fund: number;
}

interface GeneratingStepProps {
  projectName: string;
  activeChartTab: string;
  setActiveChartTab: (tab: string) => void;
  detailChartData: DetailChartData[];
  processList: Process[];
  expandedProcess: string | null;
  setExpandedProcess: (id: string | null) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PreviewStep({
  projectName,
  activeChartTab,
  setActiveChartTab,
  detailChartData,
  processList,
  expandedProcess,
  setExpandedProcess,
  onBack,
  onNext,
}: GeneratingStepProps) {
  return (
    <div className="w-full h-full flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-6 bg-[#1975D2] rounded-full"></div>
        <h2 className="text-2xl font-bold text-gray-900">
          {projectName || "住宅楼-04栋"}
        </h2>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* 左侧区域：3D模型 + 图表 */}
        <div className="col-span-8 flex flex-col gap-4 min-h-0 h-full">
          {/* 3D 模型区域 - 固定高度 */}
          <div className="bg-gray-50 rounded-xl relative overflow-hidden h-[300px] shrink-0 flex items-center justify-center border border-gray-100 shadow-sm group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white/50 z-0"></div>

            {/* 模拟3D建筑模型 */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
              <div className="relative w-full h-full max-w-lg max-h-80">
                {/* 简单的 CSS 3D 效果模拟 */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-gray-200 transform skew-x-12 rounded-lg shadow-xl border border-gray-300"></div>
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-64 bg-white border border-gray-200 shadow-2xl flex flex-col items-center justify-end p-4 gap-2 transform -translate-x-4">
                  <div className="w-full h-8 bg-blue-100 rounded"></div>
                  <div className="w-full h-8 bg-blue-100 rounded"></div>
                  <div className="w-full h-8 bg-blue-100 rounded"></div>
                  <div className="w-full h-8 bg-blue-100 rounded"></div>
                </div>
                <div className="absolute bottom-14 left-1/4 w-24 h-32 bg-gray-100 border border-gray-200 shadow-lg"></div>
                <div className="absolute bottom-12 right-1/4 w-32 h-24 bg-gray-100 border border-gray-200 shadow-lg"></div>

                {/* AI 助手按钮 */}
                <div className="absolute bottom-4 right-4 z-20">
                  <div className="w-16 h-16 bg-[#1975D2] rounded-full flex items-center justify-center shadow-lg shadow-blue-200 cursor-pointer hover:scale-105 transition-transform">
                    <span className="text-white font-medium text-xs">
                      AI助手
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部图表区域 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-[220px] flex flex-col">
            <Tabs
              value={activeChartTab}
              onValueChange={setActiveChartTab}
              className="w-full h-full flex flex-col"
            >
              <TabsList className="bg-transparent justify-start p-0 h-auto border-b w-full rounded-none">
                <TabsTrigger
                  value="resource"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#1975D2] data-[state=active]:text-[#1975D2] rounded-none px-4 py-2"
                >
                  资源曲线
                </TabsTrigger>
                <TabsTrigger
                  value="fund"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#1975D2] data-[state=active]:text-[#1975D2] rounded-none px-4 py-2"
                >
                  资金曲线
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 flex flex-col min-h-0 pt-4 relative">
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={detailChartData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f0f0f0"
                      />
                      <XAxis dataKey="month" hide />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey={
                          activeChartTab === "resource" ? "value" : "fund"
                        }
                        stroke="#93c5fd"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{
                          r: 6,
                          fill: "#3b82f6",
                          stroke: "white",
                          strokeWidth: 2,
                        }}
                        fill="url(#colorGradient)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Tabs>
          </div>

          {/* 时间轴区域 - 独立区域 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-[100px] flex flex-col justify-center relative">
            <div className="w-full h-1.5 bg-gray-100 rounded-full relative">
              <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-blue-200 rounded-full"></div>
              <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#1975D2] border-2 border-white rounded-full shadow-sm z-10"></div>

              {/* 关键节点标记 */}
              <div
                className="absolute left-[40%] top-1/2 -translate-y-1/2 w-12 h-1.5 bg-red-500 rounded-full"
                title="春节节假日"
              ></div>
              <div
                className="absolute left-[70%] top-1/2 -translate-y-1/2 w-12 h-1.5 bg-yellow-500 rounded-full"
                title="秋收罢工"
              ></div>
            </div>

            <div className="absolute top-12 left-4 text-xs text-gray-500">
              2026年
              <br />
              1月24日
            </div>
            <div className="absolute top-12 right-4 text-xs text-gray-500 text-right">
              2026年
              <br />
              8月24日
            </div>

            {/* 事件标签 */}
            <div className="absolute top-8 left-[40%] -translate-x-1/2 bg-[#D32F2F] text-white text-[10px] px-2 py-1 rounded shadow-sm flex flex-col items-center z-20">
              <span className="font-bold">春节节假日</span>
              <span className="text-[8px] opacity-80">请提前做好准备</span>
            </div>
            <div className="absolute top-8 left-[70%] -translate-x-1/2 bg-[#FBC02D] text-white text-[10px] px-2 py-1 rounded shadow-sm flex flex-col items-center z-20">
              <span className="font-bold">秋收罢工</span>
              <span className="text-[8px] opacity-80 text-black">
                请提前做好准备
              </span>
            </div>
          </div>
        </div>

        {/* 右侧工序列表 */}
        <div className="col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 pl-2 border-l-4 border-[#1975D2]">
            <h3 className="font-bold text-gray-900">当日工序</h3>
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {processList.map((process) => (
                <div
                  key={process.id}
                  className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer bg-gray-50/50"
                    onClick={() =>
                      setExpandedProcess(
                        expandedProcess === process.id ? null : process.id,
                      )
                    }
                  >
                    <span className="font-medium text-gray-800">
                      {process.id} {process.title}
                    </span>
                    {expandedProcess === process.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>

                  {expandedProcess === process.id && (
                    <div className="p-4 pt-0 bg-gray-50/30">
                      <div className="space-y-4 relative pl-4 mt-3">
                        {/* 左侧连接线 */}
                        <div className="absolute left-0 top-2 bottom-2 w-px bg-gray-200"></div>

                        {process.details.map((detail, index) => (
                          <div key={index} className="relative">
                            <div className="absolute -left-[21px] top-2 w-2.5 h-2.5 bg-gray-300 rounded-full border-2 border-white"></div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-4 mt-auto space-y-3">
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full h-12 text-base font-medium text-[#1975D2] hover:text-[#1564b3] hover:bg-blue-50 bg-gray-50 rounded-lg"
            >
              返回上一步
            </Button>
            <Button
              onClick={onNext}
              className="w-full h-12 text-base font-medium bg-[#1975D2] hover:bg-[#1564b3] shadow-lg shadow-blue-200 rounded-lg"
            >
              查看详情
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
