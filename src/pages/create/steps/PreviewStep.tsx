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
import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { ModelViewer } from "@/components/model/ModelViewer";
import type { CreateProjectContextType } from "@/types/create-project";
import { detailChartData, processList } from "@/mocks/data/create-project";
import { ChatButton } from "@/components/ai/ChatButton";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { useChatPanel } from "@/components/ai/hooks/useChatPanel";

export function PreviewStep() {
  const navigate = useNavigate();
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [indicatorPercent, setIndicatorPercent] = useState(30);
  const chatPanel = useChatPanel();
  const {
    projectName,
    activeChartTab,
    setActiveChartTab,
    expandedProcess,
    setExpandedProcess,
    handleCreateProject,
  } = useOutletContext<CreateProjectContextType>();

  const onBack = () => {
    navigate("/create/selection");
  };

  const onNext = () => {
    handleCreateProject();
  };

  // 保持 models 引用稳定，避免父组件重渲染触发 ModelViewer 重新初始化
  const models = useMemo(
    () => [
      {
        key: "default",
        src: "/models/0125.ifc",
      },
    ],
    [],
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!timelineRef.current) return;
      const { left, width } = timelineRef.current.getBoundingClientRect();
      const x = event.clientX - left;
      const percent = Math.min(100, Math.max(0, (x / width) * 100));
      setIndicatorPercent(percent);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDown = () => {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const slider = timelineRef.current;
    if (!slider) return;
    slider.addEventListener("mousedown", handleMouseDown);
    return () => {
      slider.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
  return (
    <div className="w-full h-full flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 p-6">
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
          <div className="relative h-[300px] shrink-0">
            <div className="bg-gray-50 rounded-xl relative overflow-hidden h-full border border-gray-100 shadow-sm">
              <ModelViewer
                models={models}
                className="h-full"
              />
              {/* AI 助手按钮 */}
              {!chatPanel.isOpen && (
                <div className="absolute bottom-4 right-4 z-20">
                  <ChatButton size="lg" />
                </div>
              )}
            </div>
            <ChatPanel
              state={chatPanel}
              positionType="absolute"
              position={{ bottom: 0, right: 0 }}
              height="300px"
            />
          </div>

          {/* 底部图表区域 */}
          <div className="bg-white rounded-xl p-4 h-[220px] flex flex-col">
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
          <div className="bg-white rounded-xl p-2 h-[110px] flex flex-col justify-center relative">
            <div ref={timelineRef} className="w-full select-none">
              <div className="relative pb-6">
                <div className="w-full h-1.5 bg-gray-100 rounded-full relative">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-blue-200 rounded-full"
                    style={{ width: `${indicatorPercent}%` }}
                  ></div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#1975D2] border-2 border-white rounded-full shadow-sm z-10 cursor-ew-resize"
                    style={{ left: `${indicatorPercent}%`, transform: "translate(-50%, -50%)" }}
                  ></div>

                  {/* 关键节点标记 */}
                  <div
                    className="absolute left-[40%] top-1/2 -translate-y-1/2 w-12 h-1.5 bg-red-500 rounded-full group"
                    title="春节节假日"
                  >
                    <div className="absolute top-[-36px] left-1/2 -translate-x-1/2 bg-[#D32F2F] text-white text-[10px] px-2 py-1 rounded shadow-sm flex flex-col items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      <span className="font-bold">春节节假日</span>
                      <span className="text-[8px] opacity-80">请提前做好准备</span>
                    </div>
                  </div>
                  <div
                    className="absolute left-[70%] top-1/2 -translate-y-1/2 w-12 h-1.5 bg-yellow-500 rounded-full group"
                    title="秋收罢工"
                  >
                    <div className="absolute top-[-36px] left-1/2 -translate-x-1/2 bg-[#FBC02D] text-white text-[10px] px-2 py-1 rounded shadow-sm flex flex-col items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      <span className="font-bold">秋收罢工</span>
                      <span className="text-[8px] opacity-80 text-black">
                        请提前做好准备
                      </span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-5 left-0 text-xs text-gray-500">
                  2026年
                  <br />
                  1月24日
                </div>
                <div className="absolute top-5 right-0 text-xs text-gray-500 text-right">
                  2026年
                  <br />
                  8月24日
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧工序列表 */}
        <div className="col-span-4 flex flex-col h-full gap-4 min-h-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col flex-1 min-h-0">
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
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 shrink-0">
            <div className="space-y-3">
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
                创建项目
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
