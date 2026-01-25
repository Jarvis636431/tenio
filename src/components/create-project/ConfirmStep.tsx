import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapContainer } from "@/components/map";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { CreateProjectContextType } from "@/types/create-project";

export function ConfirmStep() {
  const navigate = useNavigate();
  const {
    projectInfo,
    setProjectInfo,
    siteCoordinates,
    isCreating,
    projectName,
  } = useOutletContext<CreateProjectContextType>();

  const onBack = () => {
    navigate("/create-project/upload");
  };

  const onNext = () => {
    navigate("/create-project/selection");
  };
  return (
    <div className="min-h-full flex flex-col justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[640px] mx-auto py-2">
      {/* 顶部标题与地图横幅 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-[#1975D2] rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900">
            {projectInfo.name || projectName || "住宅楼-04栋"}
          </h2>
        </div>

        <div className="h-[120px] w-full rounded-xl overflow-hidden shadow-sm border border-gray-100 relative">
          <MapContainer
            className="w-full h-full pointer-events-none opacity-90"
            selectedPosition={siteCoordinates}
            onSelect={() => {}}
          />
          {/* 遮罩层，增加视觉质感 */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        {/* 左侧详细信息表单 */}
        <div className="space-y-4">
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <Label className="text-gray-600 font-medium text-sm text-right">
              建筑面积
            </Label>
            <Input
              value={projectInfo.area}
              onChange={(e) =>
                setProjectInfo((p) => ({
                  ...p,
                  area: e.target.value,
                }))
              }
              className="bg-gray-100/80 border-0 h-9 focus-visible:ring-0 focus-visible:bg-gray-100 font-medium text-gray-900 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <Label className="text-gray-600 font-medium text-sm text-right">
              建筑层数
            </Label>
            <Input
              value={projectInfo.floors}
              onChange={(e) =>
                setProjectInfo((p) => ({
                  ...p,
                  floors: e.target.value,
                }))
              }
              className="bg-gray-100/80 border-0 h-9 focus-visible:ring-0 focus-visible:bg-gray-100 font-medium text-gray-900 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <Label className="text-gray-600 font-medium text-sm text-right">
              楼栋数
            </Label>
            <Input
              value={projectInfo.buildingCount}
              onChange={(e) =>
                setProjectInfo((p) => ({
                  ...p,
                  buildingCount: e.target.value,
                }))
              }
              className="bg-gray-100/80 border-0 h-9 focus-visible:ring-0 focus-visible:bg-gray-100 font-medium text-gray-900 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <Label className="text-gray-600 font-medium text-sm text-right">
              结构类型
            </Label>
            <Input
              value={projectInfo.structure}
              onChange={(e) =>
                setProjectInfo((p) => ({
                  ...p,
                  structure: e.target.value,
                }))
              }
              className="bg-gray-100/80 border-0 h-9 focus-visible:ring-0 focus-visible:bg-gray-100 font-medium text-gray-900 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <Label className="text-gray-600 font-medium text-sm text-right">
              地区
            </Label>
            <Input
              value={projectInfo.location}
              onChange={(e) =>
                setProjectInfo((p) => ({
                  ...p,
                  location: e.target.value,
                }))
              }
              className="bg-gray-100/80 border-0 h-9 focus-visible:ring-0 focus-visible:bg-gray-100 font-medium text-gray-900 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <Label className="text-gray-600 font-medium text-sm text-right">
              抗震等级
            </Label>
            <Input
              value={projectInfo.safetyLevel}
              onChange={(e) =>
                setProjectInfo((p) => ({
                  ...p,
                  safetyLevel: e.target.value,
                }))
              }
              className="bg-gray-100/80 border-0 h-9 focus-visible:ring-0 focus-visible:bg-gray-100 font-medium text-gray-900 rounded-md text-sm"
            />
          </div>
        </div>

        {/* 右侧分析与补充信息 */}
        <div className="grid grid-rows-6 gap-4">
          <div className="row-span-3 space-y-2">
            <Label className="text-gray-900 font-medium text-sm">
              周边场地分析
            </Label>
            <div className="bg-gray-50/80 p-4 rounded-lg space-y-2 h-full">
              <div className="flex items-center gap-2 text-gray-800 font-medium text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-person-standing"
                >
                  <circle cx="12" cy="5" r="1" />
                  <path d="m9 20 3-6 3 6" />
                  <path d="m6 8 6 2 6-2" />
                  <path d="M12 10v4" />
                </svg>
                <span>养老院</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                注意
                <span className="text-red-500 mx-1">夜间施工</span>,
                注意<span className="text-red-500 mx-1">噪声</span>,
                注意<span className="text-red-500 mx-1">扬尘</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <Label className="text-gray-600 font-medium text-sm text-right">
              计划开工时间
            </Label>
            <Input
              value={projectInfo.startDate}
              onChange={(e) =>
                setProjectInfo((p) => ({
                  ...p,
                  startDate: e.target.value,
                }))
              }
              className="bg-gray-100/80 border-0 h-9 focus-visible:ring-0 focus-visible:bg-gray-100 font-medium text-gray-900 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <Label className="text-gray-600 font-medium text-sm text-right">
              工期上限
            </Label>
            <Input
              value={projectInfo.durationLimit}
              onChange={(e) =>
                setProjectInfo((p) => ({
                  ...p,
                  durationLimit: e.target.value,
                }))
              }
              className="bg-gray-100/80 border-0 h-9 focus-visible:ring-0 focus-visible:bg-gray-100 font-medium text-gray-900 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <Label className="text-gray-600 font-medium text-sm text-right">
              其他补充
            </Label>
            <Input
              value={projectInfo.remarks}
              onChange={(e) =>
                setProjectInfo((p) => ({
                  ...p,
                  remarks: e.target.value,
                }))
              }
              className="bg-gray-100/80 border-0 h-9 focus-visible:ring-0 focus-visible:bg-gray-100 font-medium text-gray-900 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6 pt-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-32 h-10 text-sm font-medium text-[#1975D2] hover:text-[#1564b3] hover:bg-blue-50 bg-gray-50 rounded-lg"
        >
          返回上一步
        </Button>
        <Button
          onClick={onNext}
          disabled={isCreating}
          className="w-56 h-10 text-sm font-medium bg-[#1975D2] hover:bg-[#1564b3] shadow-lg shadow-blue-200 rounded-lg"
        >
          开始分析
        </Button>
      </div>
    </div>
  );
}
