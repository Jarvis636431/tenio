import { useState } from "react";
import {
  Upload,
  FileText,
  Cloud,
  Check,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/hooks/useProject";
import {
  precreateProject,
  uploadProjectDocs,
} from "@/services/project-service";
import { useAuth } from "@/hooks/useAuth";
import { MapContainer } from "@/components/map/MapContainer";
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

export default function CreateProject() {
  const [projectDoc, setProjectDoc] = useState<File | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "upload" | "confirm" | "plan-selection" | "generating"
  >("upload");
  const [siteAddress, setSiteAddress] = useState("");
  const [siteCoordinates, setSiteCoordinates] = useState<
    [number, number] | null
  >(null);
  const [selectedPlan, setSelectedPlan] = useState<number>(1);
  const [activeChartTab, setActiveChartTab] = useState("resource");
  const [expandedProcess, setExpandedProcess] = useState<string | null>("P01");

  // 项目基础信息状态
  const [projectInfo, setProjectInfo] = useState({
    name: "",
    location: "天津市",
    floors: "地下1层，地上5层",
    heightDiff: "0.6 米",
    structure: "框架结构",
    structureSystem: "框架结构体系",
    safetyLevel: "二级",
    area: "9820m²",
    buildingCount: "1",
    startDate: "2026年3月1日",
    durationLimit: "18个月",
    remarks: "",
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { setCurrentProject, addProject, refreshProjects } = useProject();
  const { user, token } = useAuth();

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
  ) => {
    const file = event.target.files?.[0] || null;
    setter(file);
  };

  const handleFileDelete = (setter: (file: File | null) => void) => {
    setter(null);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    setter: (file: File | null) => void,
    acceptedTypes: string[],
  ) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (acceptedTypes.includes(fileExtension)) {
        setter(file);
      } else {
        toast({
          title: "文件格式不支持",
          description: `请上传 ${acceptedTypes.join(" 或 ")} 格式的文件`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleNextStep = () => {
    // 自动生成项目名称（如果未填写）
    if (!projectName.trim()) {
      let autoName = "";
      if (cadFile) {
        autoName = cadFile.name.substring(0, cadFile.name.lastIndexOf("."));
      } else if (projectDoc) {
        autoName = projectDoc.name.substring(
          0,
          projectDoc.name.lastIndexOf("."),
        );
      } else {
        autoName = `新项目 ${new Date().toLocaleDateString()}`;
      }
      setProjectName(autoName);
      // 注意：setState 是异步的，后续逻辑如果依赖 projectName 可能需要直接使用 autoName
      // 这里为了简单，我们更新 projectInfo 中的 name
      setProjectInfo((prev) => ({
        ...prev,
        name: autoName,
        location: siteAddress.trim() || prev.location,
      }));
    } else {
      const locationLabel = siteAddress.trim()
        ? siteAddress.trim()
        : siteCoordinates
          ? `${siteCoordinates[0].toFixed(6)}, ${siteCoordinates[1].toFixed(6)}`
          : "";

      setProjectInfo((prev) => ({
        ...prev,
        name: projectName.trim(),
        location: locationLabel || prev.location,
      }));
    }

    // 允许不选坐标（或者仅警告），为了匹配极简 UI，这里如果没选坐标，可以给个默认提示或跳过
    if (!siteCoordinates && !siteAddress) {
      // 如果也没输入地址，也没选坐标，稍微提示一下，但不要太强硬阻断，或者默认一个位置
    }

    setCurrentStep("confirm");
  };

  const handleNextToPlan = () => {
    setCurrentStep("plan-selection");
  };

  const handleGenerateProcess = async () => {
    setCurrentStep("generating");
  };

  const handleCreateProject = async () => {
    setIsCreating(true);

    toast({
      title: "正在创建项目",
      description: "系统正在创建项目并分析上传的文件，请稍候...",
    });

    try {
      // 确保有项目名称
      const finalProjectName =
        projectInfo.name.trim() ||
        projectName.trim() ||
        `Project_${Date.now()}`;

      // 1. 预创建项目
      const payload = {
        name: finalProjectName,
        user_id: user?.id,
      };

      const response = await precreateProject(payload, token || undefined);
      const newProjectId = response.project_id;

      // 2. 上传文件（如果有）
      const filesToUpload: File[] = [];
      if (projectDoc) filesToUpload.push(projectDoc);
      if (cadFile) filesToUpload.push(cadFile);

      if (filesToUpload.length > 0) {
        await uploadProjectDocs(
          {
            project_id: newProjectId,
            files: filesToUpload,
            file_type: "mixed",
          },
          token || undefined,
        );
      }

      // 模拟解析过程
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newProject = {
        id: newProjectId,
        name: finalProjectName,
        hasBasicInfo: true,
        status: response.status,
      };

      addProject(newProject);
      setCurrentProject(newProject);
      refreshProjects();

      toast({
        title: "项目创建成功",
        description: `项目"${finalProjectName}"已成功创建`,
      });

      navigate(`/project/${newProjectId}`);
    } catch (error) {
      toast({
        title: "创建失败",
        description:
          error instanceof Error
            ? error.message
            : "项目创建过程中出现错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (currentStep === "plan-selection") {
      setCurrentStep("confirm");
    } else if (currentStep === "confirm") {
      setCurrentStep("upload");
    }
  };

  // 模拟工期-成本数据
  const planChartData = [
    { month: 10, cost: 9500 },
    { month: 12, cost: 8800 },
    { month: 14, cost: 8400 },
    { month: 16, cost: 8200 },
    { month: 18, cost: 8100 }, // 最优成本点
    { month: 20, cost: 8150 },
    { month: 22, cost: 8300 },
    { month: 24, cost: 8600 },
    { month: 26, cost: 9000 },
  ];

  // 模拟详情页图表数据
  const detailChartData = Array.from({ length: 12 }, (_, i) => ({
    month: `2026-${i + 1}`,
    value: Math.floor(Math.random() * 50) + 20 + i * 5,
    fund: Math.floor(Math.random() * 1000) + 500 + i * 100,
    progress: Math.min(100, (i + 1) * 8),
  }));

  const processList = [
    {
      id: "P01",
      title: "主体结构标准层施工",
      details: [
        "测量放线：弹出柱、墙的位置线和水平控制线，轴线偏差需在±3mm内",
        "墙柱钢筋绑扎：连接纵向主筋，绑扎箍筋，安装保护层垫块。",
        "模板安装：搭建支架，安装墙板、梁板底模。检查模板平整度、支撑稳定性。",
      ],
    },
    {
      id: "P02",
      title: "二次结构砌筑",
      details: [
        "植筋：钻孔、清孔、注胶、植入钢筋。",
        "构造柱施工：绑扎钢筋，支模，浇筑混凝土。",
      ],
    },
    {
      id: "P03",
      title: "外墙爬架提升",
      details: ["附墙支座安装。", "架体提升。", "安全检查。"],
    },
    {
      id: "P04",
      title: "机电管线预埋",
      details: ["定位划线。", "管路敷设。", "管路固定。"],
    },
  ];

  const planOptions = [
    {
      id: 1,
      title: "施工方案1",
      endDate: "2027年3月16日",
      cost: "8450万元",
      tag: "推荐",
      tagColor: "bg-yellow-400",
      costTag: "低",
      durationTag: "早",
    },
    {
      id: 2,
      title: "施工方案2",
      endDate: "2027年3月29日",
      cost: "8327万元",
      costTag: "低",
    },
    {
      id: 3,
      title: "施工方案3",
      endDate: "2027年4月16日",
      cost: "8747万元",
    },
    {
      id: 4,
      title: "施工方案4",
      endDate: "2027年5月24日",
      cost: "9447万元",
    },
  ];

  // 渲染上传卡片辅助函数
  const renderUploadCard = (
    title: string,
    subtitle: string,
    file: File | null,
    setFile: (f: File | null) => void,
    accept: string[],
    iconType: "cad" | "doc",
  ) => {
    const fileExt = file?.name.split(".").pop()?.toUpperCase() || "";

    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-[180px] flex flex-col">
        <div
          className={`flex-1 border-2 border-dashed rounded-lg transition-colors cursor-pointer flex flex-col items-center justify-center p-4 ${
            file
              ? "border-blue-200 bg-blue-50/30"
              : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          }`}
          onDrop={(e) => handleDrop(e, setFile, accept)}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById(`upload-${iconType}`)?.click()}
        >
          {!file ? (
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-gray-700">{title}</p>
              <p className="text-[10px] text-gray-400">{subtitle}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full bg-white p-2.5 rounded-lg shadow-sm border border-gray-100">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-[10px] ${
                  iconType === "cad" ? "bg-green-500" : "bg-blue-500"
                }`}
              >
                {fileExt || (iconType === "cad" ? "DWG" : "TXT")}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-[10px] text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(1)}Mb
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileDelete(setFile);
                }}
              >
                <span className="sr-only">删除</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 18 12" />
                </svg>
              </Button>
            </div>
          )}
          <input
            type="file"
            id={`upload-${iconType}`}
            accept={accept.join(",")}
            className="hidden"
            onChange={(e) => handleFileUpload(e, setFile)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* 顶部导航栏 */}
      <div className="flex items-center px-8 py-4 border-b border-gray-100 bg-white shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="mr-4 text-gray-500 hover:text-gray-900"
          onClick={() => navigate(-1)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-arrow-left mr-2"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          返回
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">新建项目</h1>
      </div>

      <div
        className={`flex-1 overflow-auto ${currentStep === "plan-selection" || currentStep === "generating" ? "p-4" : "p-12"}`}
      >
        {currentStep === "upload" ? (
          <div className="max-w-[1000px] mx-auto min-h-full flex flex-col justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-center">
              {/* 左侧上传区 */}
              <div className="flex flex-col gap-4 justify-center w-full max-w-md mx-auto">
                {renderUploadCard(
                  "点击上传CAD图纸/BIM模型",
                  "支持 .dwg/ .rvt/ .ifc 格式",
                  cadFile,
                  setCadFile,
                  [".dwg", ".rvt", ".ifc", ".dxf"],
                  "cad",
                )}
                {renderUploadCard(
                  "点击上传设计说明",
                  "支持 .doc/ .txt 格式",
                  projectDoc,
                  setProjectDoc,
                  [".doc", ".docx", ".txt", ".pdf"],
                  "doc",
                )}
              </div>

              {/* 右侧地图区 */}
              <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[376px] w-full max-w-md mx-auto relative">
                <div className="absolute top-4 left-4 right-4 z-10">
                  <div className="relative bg-white/90 backdrop-blur rounded-lg shadow-sm border border-gray-200">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </div>
                    <Input
                      className="border-0 bg-transparent h-10 pl-9 focus-visible:ring-0 text-sm"
                      placeholder="搜索地点"
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 w-full h-full bg-gray-50">
                  <MapContainer
                    className="w-full h-full"
                    selectedPosition={siteCoordinates}
                    onSelect={setSiteCoordinates}
                  />
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="mt-8 flex justify-center">
              <Button
                className="w-full max-w-md h-12 text-base font-medium bg-[#1975D2] hover:bg-[#1564b3] shadow-lg shadow-blue-200"
                onClick={handleNextStep}
              >
                信息提取
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`mx-auto h-full flex flex-col ${currentStep === "generating" ? "justify-start" : "justify-center"} ${currentStep === "plan-selection" || currentStep === "generating" ? "w-full max-w-full" : "max-w-[800px]"}`}
          >
            {currentStep === "confirm" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1000px] mx-auto py-2">
                {/* 顶部标题与地图横幅 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#1975D2] rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {projectInfo.name || "住宅楼-04栋"}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {/* 左侧详细信息表单 */}
                  <div className="space-y-3">
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-medium text-sm">
                        周边场地分析
                      </Label>
                      <div className="bg-gray-50/80 p-4 rounded-lg space-y-2">
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

                    <div className="space-y-3">
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
                </div>

                <div className="flex justify-center gap-6 pt-6">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="w-32 h-10 text-sm font-medium text-[#1975D2] hover:text-[#1564b3] hover:bg-blue-50 bg-gray-50 rounded-lg"
                  >
                    返回上一步
                  </Button>
                  <Button
                    onClick={handleNextToPlan}
                    disabled={isCreating}
                    className="w-56 h-10 text-sm font-medium bg-[#1975D2] hover:bg-[#1564b3] shadow-lg shadow-blue-200 rounded-lg"
                  >
                    开始分析
                  </Button>
                </div>
              </div>
            )}

            {currentStep === "plan-selection" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 w-full h-full flex flex-col">
                <div className="bg-gray-50/50 rounded-xl p-6 flex-1 min-h-[360px] relative">
                  <div className="absolute top-4 left-6 text-sm text-gray-400">
                    成本
                  </div>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
                    <div className="text-xl font-medium text-gray-800">
                      18个月
                    </div>
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
                      <ReferenceLine
                        x={18}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                      />
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

                <div className="grid grid-cols-4 gap-4 h-[200px]">
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

                      <div className="space-y-2">
                        <h3 className="font-bold text-xl text-gray-900">
                          {plan.title}
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-base">
                          <span className="text-gray-700 font-medium">
                            {plan.endDate}
                          </span>
                          <span className="text-xs text-gray-400">
                            预期结束日期
                          </span>
                          {plan.durationTag && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">
                              {plan.durationTag}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-base">
                          <span className="text-gray-900 font-bold text-xl">
                            {plan.cost}
                          </span>
                          <span className="text-xs text-gray-400">
                            预期建设成本
                          </span>
                          {plan.costTag && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">
                              {plan.costTag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-6 pt-2 pb-2 shrink-0">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="w-32 h-12 text-base font-medium text-[#1975D2] hover:text-[#1564b3] hover:bg-blue-50 bg-gray-50 rounded-lg"
                  >
                    返回上一步
                  </Button>
                  <Button
                    onClick={handleGenerateProcess}
                    className="w-56 h-12 text-base font-medium bg-[#1975D2] hover:bg-[#1564b3] shadow-lg shadow-blue-200 rounded-lg"
                  >
                    开始分析
                  </Button>
                </div>
              </div>
            )}

            {currentStep === "generating" && (
              <div className="w-full h-full flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#1975D2] rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {projectInfo.name || "住宅楼-04栋"}
                  </h2>
                </div>

                <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                  {/* 左侧区域：3D模型 + 图表 */}
                  <div className="col-span-8 flex flex-col gap-6 min-h-0">
                    {/* 3D 模型区域 */}
                    <div className="bg-gray-50 rounded-xl relative overflow-hidden flex-1 min-h-[300px] flex items-center justify-center border border-gray-100 shadow-sm group">
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
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-[320px] flex flex-col">
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
                          <TabsTrigger
                            value="progress"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#1975D2] data-[state=active]:text-[#1975D2] rounded-none px-4 py-2"
                          >
                            进度曲线
                          </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 min-h-0 pt-4 relative">
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
                                  activeChartTab === "resource"
                                    ? "value"
                                    : activeChartTab === "fund"
                                      ? "fund"
                                      : "progress"
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

                          {/* 时间轴覆盖层 */}
                          <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center px-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
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

                            <div className="absolute -bottom-6 left-4 text-xs text-gray-500">
                              2026年
                              <br />
                              1月24日
                            </div>
                            <div className="absolute -bottom-6 right-4 text-xs text-gray-500 text-right">
                              2026年
                              <br />
                              8月24日
                            </div>

                            {/* 事件标签 */}
                            <div className="absolute -bottom-10 left-[40%] -translate-x-1/2 bg-[#D32F2F] text-white text-[10px] px-2 py-1 rounded shadow-sm flex flex-col items-center">
                              <span className="font-bold">春节节假日</span>
                              <span className="text-[8px] opacity-80">
                                请提前做好准备
                              </span>
                            </div>
                            <div className="absolute -bottom-10 left-[70%] -translate-x-1/2 bg-[#FBC02D] text-white text-[10px] px-2 py-1 rounded shadow-sm flex flex-col items-center">
                              <span className="font-bold">秋收罢工</span>
                              <span className="text-[8px] opacity-80 text-black">
                                请提前做好准备
                              </span>
                            </div>
                          </div>
                        </div>
                      </Tabs>
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
                                  expandedProcess === process.id
                                    ? null
                                    : process.id,
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
                </div>

                <div className="flex justify-between items-center pt-2 pb-2 shrink-0">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="w-32 h-12 text-base font-medium text-[#1975D2] hover:text-[#1564b3] hover:bg-blue-50 bg-gray-50 rounded-lg"
                  >
                    返回上一步
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    className="w-56 h-12 text-base font-medium bg-[#1975D2] hover:bg-[#1564b3] shadow-lg shadow-blue-200 rounded-lg"
                  >
                    查看详情
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
