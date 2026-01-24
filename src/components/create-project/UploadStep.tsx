import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapContainer } from "@/components/map/MapContainer";
import { useToast } from "@/hooks/use-toast";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { CreateProjectContextType } from "./types";

export function UploadStep() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [citiesByProvince, setCitiesByProvince] = useState<Record<string, string[]>>({});
  const [searchToken, setSearchToken] = useState(0);
  const {
    cadFile,
    setCadFile,
    projectDoc,
    setProjectDoc,
    siteAddress,
    setSiteAddress,
    siteCoordinates,
    setSiteCoordinates,
    setProjectName,
    setProjectInfo,
    projectName,
  } = useOutletContext<CreateProjectContextType>();

  const cityOptions = useMemo(() => citiesByProvince[province] ?? [], [citiesByProvince, province]);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)._AMapSecurityConfig = {
      securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE,
    };

    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,
      version: "2.0",
      plugins: ["AMap.DistrictSearch"],
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((AMap: any) => {
        if (!active) return;
        const districtSearch = new AMap.DistrictSearch({
          level: "country",
          subdistrict: 1,
          extensions: "base",
        });

        districtSearch.search("中国", (status: string, result: any) => {
          if (!active || status !== "complete") return;
          const list = result?.districtList?.[0]?.districtList ?? [];
          const provinceNames = list
            .filter((item: any) => item?.name && item?.adcode)
            .sort((a: any, b: any) => Number(a.adcode) - Number(b.adcode))
            .map((item: any) => item.name);
          setProvinces(provinceNames);
          if (!province && provinceNames.length > 0) {
            setProvince(provinceNames[0]);
          }
        });
      })
      .catch((error) => {
        console.error("高德行政区数据加载失败:", error);
      });

    return () => {
      active = false;
    };
  }, [province]);

  useEffect(() => {
    if (!province) return;
    let active = true;

    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,
      version: "2.0",
      plugins: ["AMap.DistrictSearch"],
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((AMap: any) => {
        if (!active) return;
        const districtSearch = new AMap.DistrictSearch({
          level: "province",
          subdistrict: 1,
          extensions: "base",
        });
        districtSearch.search(province, (status: string, result: any) => {
          if (!active || status !== "complete") return;
          const list = result?.districtList?.[0]?.districtList ?? [];
          const cityNames = list
            .filter((item: any) => item?.name && item?.adcode)
            .sort((a: any, b: any) => Number(a.adcode) - Number(b.adcode))
            .map((item: any) => item.name);
          setCitiesByProvince((prev) => ({
            ...prev,
            [province]: cityNames,
          }));
          if (cityNames.length > 0 && !cityNames.includes(city)) {
            setCity(cityNames[0]);
          }
        });
      })
      .catch((error) => {
        console.error("高德城市数据加载失败:", error);
      });

    return () => {
      active = false;
    };
  }, [province, city]);

  const handleNext = () => {
    const locationLabel = siteAddress.trim()
      ? siteAddress.trim()
      : siteCoordinates
        ? `${siteCoordinates[0].toFixed(6)}, ${siteCoordinates[1].toFixed(6)}`
        : "";

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
      setProjectInfo((prev) => ({
        ...prev,
        name: autoName,
        location: locationLabel || prev.location,
      }));
    } else {
      setProjectInfo((prev) => ({
        ...prev,
        name: projectName.trim(),
        location: locationLabel || prev.location,
      }));
    }

    navigate("/create-project/confirm");
  };

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
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-full flex flex-col">
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
                  <path d="M6 6 18 18" />
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
    <div className="w-full h-full flex flex-col items-center px-8 py-6 overflow-hidden">
      <div className="w-full max-w-[1100px] flex flex-col h-full">
        <div className="w-full mb-6">
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="请输入项目名称"
            className="h-12 text-lg"
          />
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_640px] gap-6 min-h-0 items-stretch">
          {/* 左侧上传区 */}
          <div className="flex flex-col gap-4 h-full">
            <div className="grid grid-rows-2 gap-4 flex-1 min-h-0">
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
          </div>

          {/* 右侧地图区 */}
          <div className="flex flex-col gap-3 h-full lg:w-[640px]">
            <div className="flex items-center gap-2">
                <Select
                  value={province}
                  onValueChange={(value) => {
                    setProvince(value);
                  }}
                >
                  <SelectTrigger className="h-10 w-32 text-sm">
                    <SelectValue placeholder="选择省份" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-10 w-32 text-sm">
                  <SelectValue placeholder="选择城市" />
                </SelectTrigger>
                <SelectContent>
                  {cityOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setSearchToken((prev) => prev + 1);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="w-full h-full bg-gray-50">
                <MapContainer
                  className="w-full h-full"
                  selectedPosition={siteCoordinates}
                  onSelect={setSiteCoordinates}
                  searchQuery={siteAddress}
                  searchCity={city}
                  searchToken={searchToken}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-6 shrink-0 flex justify-center pb-2">
          <Button
            className="w-full max-w-md h-12 text-base font-medium bg-[#1975D2] hover:bg-[#1564b3] shadow-lg shadow-blue-200"
            onClick={handleNext}
          >
            信息提取
          </Button>
        </div>
      </div>
    </div>
  );
}
