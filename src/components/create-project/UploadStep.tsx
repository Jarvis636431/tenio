import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapContainer } from "@/components/map/MapContainer";
import { useToast } from "@/hooks/use-toast";

interface UploadStepProps {
  cadFile: File | null;
  setCadFile: (file: File | null) => void;
  projectDoc: File | null;
  setProjectDoc: (file: File | null) => void;
  siteAddress: string;
  setSiteAddress: (address: string) => void;
  siteCoordinates: [number, number] | null;
  setSiteCoordinates: (coords: [number, number] | null) => void;
  onNext: () => void;
}

export function UploadStep({
  cadFile,
  setCadFile,
  projectDoc,
  setProjectDoc,
  siteAddress,
  setSiteAddress,
  siteCoordinates,
  setSiteCoordinates,
  onNext,
}: UploadStepProps) {
  const { toast } = useToast();

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
          onClick={onNext}
        >
          信息提取
        </Button>
      </div>
    </div>
  );
}
