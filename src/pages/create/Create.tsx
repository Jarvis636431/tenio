import { useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useProject } from "@/hooks/useProject";
import {
  precreateProject,
  uploadProjectDocs,
} from "@/services/project-service";
import { useAuth } from "@/hooks/useAuth";
import type { CreateProjectContextType } from "@/types/create-project";
import { useCreateProjectStore } from "@/stores/createProjectStore";

export default function Create() {
  const {
    projectDoc,
    setProjectDoc,
    cadFile,
    setCadFile,
    projectName,
    setProjectName,
    projectId,
    setProjectId,
    solutionData,
    setSolutionData,
    projectInfo,
    setProjectInfo,
    siteAddress,
    setSiteAddress,
    siteCoordinates,
    setSiteCoordinates,
    selectedPlan,
    setSelectedPlan,
    activeChartTab,
    setActiveChartTab,
    expandedProcess,
    setExpandedProcess,
    isCreating,
    setIsCreating,
  } = useCreateProjectStore();

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentProject, addProject, refreshProjects } = useProject();
  const { user, token } = useAuth();

  const handleCreateProject = useCallback(async () => {
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
  }, [
    projectInfo.name,
    projectName,
    user?.id,
    token,
    projectDoc,
    cadFile,
    addProject,
    setCurrentProject,
    refreshProjects,
    toast,
    navigate,
    setIsCreating,
  ]);

  const contextValue: CreateProjectContextType = useMemo(
    () => ({
      projectDoc,
      setProjectDoc,
      cadFile,
      setCadFile,
      projectName,
      setProjectName,
      projectId,
      setProjectId,
      solutionData,
      setSolutionData,
      projectInfo,
      setProjectInfo,
      siteAddress,
      setSiteAddress,
      siteCoordinates,
      setSiteCoordinates,
      selectedPlan,
      setSelectedPlan,
      activeChartTab,
      setActiveChartTab,
      expandedProcess,
      setExpandedProcess,
      isCreating,
      handleCreateProject,
    }),
    [
      projectDoc,
      cadFile,
      projectName,
      projectId,
      solutionData,
      projectInfo,
      siteAddress,
      siteCoordinates,
      selectedPlan,
      activeChartTab,
      expandedProcess,
      isCreating,
      handleCreateProject,
    ],
  );

  const currentPath = location.pathname.split("/").pop();
  const stepMap: Record<string, number> = {
    upload: 1,
    confirm: 2,
    selection: 3,
    preview: 4,
  };
  const currentStep = stepMap[currentPath ?? "upload"] ?? 1;

  useEffect(() => {
    return () => {
      useCreateProjectStore.getState().reset();
    };
  }, []);

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
        <div className="ml-auto flex items-center gap-3">
          <div className="relative flex items-center gap-10">
            <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-gray-200" />
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="relative z-10 flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors ${
                    step <= currentStep
                      ? "bg-[#1975D2] text-white border-[#1975D2]"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-0">
        <Outlet context={contextValue} />
      </div>
    </div>
  );
}
