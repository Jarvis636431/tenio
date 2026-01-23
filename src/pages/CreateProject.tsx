import { useState } from "react";
import { Upload, FileText, Cloud, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/hooks/useProject";
import {
  precreateProject,
  uploadProjectDocs,
} from "@/services/project-service";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { MapContainer } from "@/components/map/MapContainer";

export default function CreateProject() {
  const [projectDoc, setProjectDoc] = useState<File | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "upload" | "confirm" | "generating"
  >("upload");
  const [siteAddress, setSiteAddress] = useState("");
  const [siteCoordinates, setSiteCoordinates] = useState<
    [number, number] | null
  >(null);

  // 项目基础信息状态
  const [projectInfo, setProjectInfo] = useState({
    name: "",
    location: "河北省石家庄市",
    floors: "小高层住宅 11 层",
    heightDiff: "0.6 米",
    structure: "剪力墙",
    structureSystem: "剪力墙结构体系",
    safetyLevel: "二级",
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

  const handleGenerateProcess = async () => {
    setCurrentStep("generating");
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
      await new Promise((resolve) => setTimeout(resolve, 2000));

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
      setCurrentStep("confirm");
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    setCurrentStep("upload");
  };

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
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-[220px] flex flex-col">
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
              <p className="text-base font-medium text-gray-700">{title}</p>
              <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <div
                className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold text-[10px] ${
                  iconType === "cad" ? "bg-green-500" : "bg-blue-500"
                }`}
              >
                {fileExt || (iconType === "cad" ? "DWG" : "TXT")}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-[10px] text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(1)}Mb
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileDelete(setFile);
                }}
              >
                <span className="sr-only">删除</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* 顶部导航栏 */}
      <div className="flex items-center px-8 py-4 border-b border-gray-100 bg-white">
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

      <div className="flex-1 overflow-auto p-12">
        {currentStep === "upload" ? (
          <div className="max-w-[1200px] mx-auto h-full flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 flex-1 items-center">
              {/* 左侧上传区 */}
              <div className="flex flex-col gap-6 justify-center w-full max-w-lg mx-auto">
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
              <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[480px] w-full max-w-lg mx-auto relative">
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
            <div className="mt-auto pt-6 flex justify-center">
              <Button
                className="w-full max-w-lg h-12 text-base font-medium bg-[#1975D2] hover:bg-[#1564b3] shadow-lg shadow-blue-200"
                onClick={handleNextStep}
              >
                信息提取
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto mt-8">
            <Card>
              <CardContent className="p-8">
                {currentStep === "confirm" && (
                  <div className="space-y-8">
                    <div className="p-4 bg-blue-50 mb-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        </div>
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">
                            系统已解析项目基础信息
                          </p>
                          <p>
                            请确认以上信息无误后，点击"生成工序"开始创建施工工序计划。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="project-name-edit">项目名称</Label>
                          <Input
                            id="project-name-edit"
                            value={projectInfo.name}
                            onChange={(e) =>
                              setProjectInfo((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="bg-white h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-location">建设地点</Label>
                          <Input
                            id="project-location"
                            value={projectInfo.location}
                            onChange={(e) =>
                              setProjectInfo((prev) => ({
                                ...prev,
                                location: e.target.value,
                              }))
                            }
                            className="bg-white h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-floors">层数</Label>
                          <Input
                            id="project-floors"
                            value={projectInfo.floors}
                            onChange={(e) =>
                              setProjectInfo((prev) => ({
                                ...prev,
                                floors: e.target.value,
                              }))
                            }
                            className="bg-white h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-height-diff">
                            室内外高差
                          </Label>
                          <Input
                            id="project-height-diff"
                            value={projectInfo.heightDiff}
                            onChange={(e) =>
                              setProjectInfo((prev) => ({
                                ...prev,
                                heightDiff: e.target.value,
                              }))
                            }
                            className="bg-white h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-structure">结构形式</Label>
                          <Input
                            id="project-structure"
                            value={projectInfo.structure}
                            onChange={(e) =>
                              setProjectInfo((prev) => ({
                                ...prev,
                                structure: e.target.value,
                              }))
                            }
                            className="bg-white h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-structure-system">
                            结构体系
                          </Label>
                          <Input
                            id="project-structure-system"
                            value={projectInfo.structureSystem}
                            onChange={(e) =>
                              setProjectInfo((prev) => ({
                                ...prev,
                                structureSystem: e.target.value,
                              }))
                            }
                            className="bg-white h-10"
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="project-safety-level">
                            建筑结构安全等级
                          </Label>
                          <Input
                            id="project-safety-level"
                            value={projectInfo.safetyLevel}
                            onChange={(e) =>
                              setProjectInfo((prev) => ({
                                ...prev,
                                safetyLevel: e.target.value,
                              }))
                            }
                            className="bg-white h-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        className="h-10 px-6"
                      >
                        上一步
                      </Button>
                      <Button
                        onClick={handleGenerateProcess}
                        disabled={isCreating}
                        className="h-10 px-6"
                      >
                        生成工序
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === "generating" && (
                  <div className="space-y-8 py-8">
                    <div className="flex flex-col items-center justify-center space-y-6 text-center">
                      <div className="relative">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                          <Cloud className="h-10 w-10 text-blue-600" />
                        </div>
                        <div className="absolute top-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-bounce"></div>
                      </div>

                      <div className="space-y-2 max-w-md">
                        <h3 className="text-xl font-semibold text-gray-900">
                          正在生成施工工序
                        </h3>
                        <p className="text-gray-500">
                          系统正在分析上传文件并生成施工计划，这可能需要几分钟时间，请稍候...
                        </p>
                      </div>

                      <div className="w-full max-w-md space-y-4 text-left bg-gray-50 p-6 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <p className="text-sm font-medium text-gray-700">
                            正在上传项目文件...
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <p className="text-sm font-medium text-gray-700">
                            正在解析CAD图纸结构...
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <p className="text-sm text-gray-500">
                            等待生成施工工序...
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
