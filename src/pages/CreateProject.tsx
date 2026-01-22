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
    if (!projectName.trim()) {
      toast({
        title: "请完善信息",
        description: "请输入项目名称",
        variant: "destructive",
      });
      return;
    }
    if (!siteCoordinates) {
      toast({
        title: "请选择位置",
        description: "请在地图上选择项目位置",
        variant: "destructive",
      });
      return;
    }
    // 同步项目名称到项目信息中
    const locationLabel = siteAddress.trim()
      ? siteAddress.trim()
      : `${siteCoordinates[0].toFixed(6)}, ${siteCoordinates[1].toFixed(6)}`;
    setProjectInfo((prev) => ({
      ...prev,
      name: projectName.trim(),
      location: locationLabel,
    }));
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
      // 1. 预创建项目
      const payload = {
        name: projectInfo.name.trim() || projectName.trim(),
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
            file_type: "mixed", // 或者是具体的类型，根据后端要求调整
          },
          token || undefined,
        );
      }

      // 模拟解析过程（如果后端处理很快，这个延迟可以去掉）
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newProject = {
        id: newProjectId,
        name: projectInfo.name.trim() || projectName.trim(),
        hasBasicInfo: true,
        status: response.status,
      };

      addProject(newProject);
      setCurrentProject(newProject);
      refreshProjects();

      toast({
        title: "项目创建成功",
        description: `项目"${projectInfo.name.trim() || projectName}"已成功创建（状态：${response.status || "precreated"}）`,
      });

      // 导航到新项目的首页
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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-auto px-0 pb-6">
        <div className="max-w-3xl mx-auto mt-8">
          <Card>
            <CardContent className="p-8">
              {currentStep === "confirm" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">系统已解析项目基础信息</p>
                      <p>
                        请确认以上信息无误后，点击"生成工序"开始创建施工工序计划。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === "upload" && (
                <div className="space-y-8">
                  {/* 项目名称输入 */}
                  <div className="space-y-2">
                    <Label htmlFor="project-name" className="text-base">
                      项目名称 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="project-name"
                      placeholder="请输入项目名称"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-base">CAD图纸</Label>
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer h-56 flex flex-col items-center justify-center"
                          onDrop={(e) =>
                            handleDrop(e, setCadFile, [".dwg", ".dwf", ".dxf"])
                          }
                          onDragOver={handleDragOver}
                          onClick={() =>
                            document.getElementById("cad-file")?.click()
                          }
                        >
                          {!cadFile && (
                            <>
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Upload className="h-6 w-6 text-gray-500" />
                              </div>
                              <p className="font-medium text-gray-900 mb-1">
                                点击上传CAD图纸
                              </p>
                              <p className="text-xs text-gray-500">
                                支持 .dwg, .dwf, .dxf 格式
                              </p>
                            </>
                          )}
                          {cadFile && (
                            <div className="space-y-4 w-full">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <FileText className="h-6 w-6 text-blue-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-900 truncate px-4">
                                {cadFile.name}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileDelete(setCadFile);
                                }}
                              >
                                删除文件
                              </Button>
                            </div>
                          )}
                          <input
                            type="file"
                            accept=".dwg,.dwf,.dxf"
                            onChange={(e) => handleFileUpload(e, setCadFile)}
                            className="hidden"
                            id="cad-file"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base">项目说明文件</Label>
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer h-56 flex flex-col items-center justify-center"
                          onDrop={(e) =>
                            handleDrop(e, setProjectDoc, [
                              ".pdf",
                              ".doc",
                              ".docx",
                            ])
                          }
                          onDragOver={handleDragOver}
                          onClick={() =>
                            document.getElementById("project-doc")?.click()
                          }
                        >
                          {!projectDoc && (
                            <>
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Upload className="h-6 w-6 text-gray-500" />
                              </div>
                              <p className="font-medium text-gray-900 mb-1">
                                点击上传说明文档
                              </p>
                              <p className="text-xs text-gray-500">
                                支持 .pdf, .doc, .docx 格式
                              </p>
                            </>
                          )}
                          {projectDoc && (
                            <div className="space-y-4 w-full">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <FileText className="h-6 w-6 text-blue-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-900 truncate px-4">
                                {projectDoc.name}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileDelete(setProjectDoc);
                                }}
                              >
                                删除文件
                              </Button>
                            </div>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleFileUpload(e, setProjectDoc)}
                            className="hidden"
                            id="project-doc"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="project-location-input"
                          className="text-base"
                        >
                          地址搜索
                        </Label>
                        <Input
                          id="project-location-input"
                          placeholder="搜索地址或地标"
                          value={siteAddress}
                          onChange={(e) => setSiteAddress(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="h-[420px]">
                          <MapContainer
                            className="w-full h-full"
                            selectedPosition={siteCoordinates}
                            onSelect={setSiteCoordinates}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 按钮组 */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate(-1)}
                      className="h-10 px-6"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      disabled={!projectName.trim()}
                      className="h-10 px-6"
                    >
                      下一步
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === "confirm" && (
                <div className="space-y-8">
                  {/* 项目基础信息 */}
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
                        <Label htmlFor="project-height-diff">室内外高差</Label>
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

                  {/* 按钮组 */}
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
      </div>
    </div>
  );
}
