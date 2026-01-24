import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/hooks/useProject";
import {
  precreateProject,
  uploadProjectDocs,
} from "@/services/project-service";
import { useAuth } from "@/hooks/useAuth";
import { UploadStep } from "@/components/create-project/UploadStep";
import { ConfirmStep } from "@/components/create-project/ConfirmStep";
import { SelectionStep } from "@/components/create-project/SelectionStep";
import { PreviewStep } from "@/components/create-project/PreviewStep";

export default function CreateProject() {
  const [projectDoc, setProjectDoc] = useState<File | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "upload" | "confirm" | "selection" | "preview"
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

    setCurrentStep("confirm");
  };

  const handleNextToPlan = () => {
    setCurrentStep("selection");
  };

  const handleGenerateProcess = async () => {
    setCurrentStep("preview");
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
    if (currentStep === "selection") {
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
        className={`flex-1 overflow-auto ${
          currentStep === "selection" || currentStep === "preview"
            ? "p-4"
            : "p-12"
        }`}
      >
        {currentStep === "upload" ? (
          <UploadStep
            cadFile={cadFile}
            setCadFile={setCadFile}
            projectDoc={projectDoc}
            setProjectDoc={setProjectDoc}
            siteAddress={siteAddress}
            setSiteAddress={setSiteAddress}
            siteCoordinates={siteCoordinates}
            setSiteCoordinates={setSiteCoordinates}
            onNext={handleNextStep}
          />
        ) : (
          <div
            className={`mx-auto h-full flex flex-col ${
              currentStep === "preview" ? "justify-start" : "justify-center"
            } ${
              currentStep === "selection" || currentStep === "preview"
                ? "w-full max-w-full"
                : "max-w-[800px]"
            }`}
          >
            {currentStep === "confirm" && (
              <ConfirmStep
                projectInfo={projectInfo}
                setProjectInfo={setProjectInfo}
                siteCoordinates={siteCoordinates}
                onBack={handleBack}
                onNext={handleNextToPlan}
                isCreating={isCreating}
              />
            )}

            {currentStep === "selection" && (
              <SelectionStep
                planChartData={planChartData}
                planOptions={planOptions}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                onBack={handleBack}
                onNext={handleGenerateProcess}
              />
            )}

            {currentStep === "preview" && (
              <PreviewStep
                projectName={projectInfo.name}
                activeChartTab={activeChartTab}
                setActiveChartTab={setActiveChartTab}
                detailChartData={detailChartData}
                processList={processList}
                expandedProcess={expandedProcess}
                setExpandedProcess={setExpandedProcess}
                onBack={handleBack}
                onNext={handleCreateProject}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
