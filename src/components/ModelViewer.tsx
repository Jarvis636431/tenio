import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type IfcViewerAPIType = {
  IFC: {
    setWasmPath: (path: string) => void;
    loadIfcUrl: (url: string, settings?: Record<string, unknown>) => Promise<void>;
  };
  axes: { setAxes: () => void };
  grid: { setGrid: () => void };
  context: { renderer: { domElement: HTMLCanvasElement } };
  dispose: () => void;
};

interface ModelViewerProps {
  src?: string;
  allowUpload?: boolean;
  className?: string;
}

/**
 * 轻量级 IFC 模型查看器：
 * - 默认使用 CDN 动态加载 three.js 与 IFC.js，无需提前安装依赖
 * - 支持通过 props 传入 IFC 模型 URL，或允许用户本地上传
 * - 仅作演示用途，后续可扩展构件拾取、剖切等功能
 */
export function ModelViewer({ src, allowUpload = false, className }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<IfcViewerAPIType | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    let disposed = false;

    const initViewer = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        const [{ IfcViewerAPI }, THREE] = await Promise.all([
          import(
            /* @vite-ignore */
            "https://cdn.skypack.dev/@ifcjs/ifcjs@1.0.181"
          ),
          import(
            /* @vite-ignore */
            "https://cdn.skypack.dev/three@0.162.0"
          ),
        ]);

        if (disposed) return;

        const viewer: IfcViewerAPIType = new IfcViewerAPI({
          container: containerRef.current!,
          backgroundColor: new THREE.Color("#f0f0f0"),
        });

        viewer.axes.setAxes();
        viewer.grid.setGrid();

        // 使用 CDN 提供的 web-ifc.wasm；如需离线部署，可将 wasm 文件放在 /public/wasm/
        viewer.IFC.setWasmPath("https://cdn.jsdelivr.net/npm/web-ifc@0.0.53/");

        viewerRef.current = viewer;
      } catch (err) {
        console.error(err);
        setError("初始化模型查看器失败，请检查网络连接或稍后重试。");
      } finally {
        if (!disposed) {
          setIsInitializing(false);
        }
      }
    };

    initViewer();

    return () => {
      disposed = true;
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, []);

  const loadModel = async (url: string) => {
    if (!viewerRef.current) return;
    setIsLoadingModel(true);
    setError(null);
    try {
      await viewerRef.current.IFC.loadIfcUrl(url);
    } catch (err) {
      console.error(err);
      setError("模型加载失败，请确认 IFC 文件是否有效。");
    } finally {
      setIsLoadingModel(false);
    }
  };

  useEffect(() => {
    if (src) {
      loadModel(src);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    await loadModel(url);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("relative h-full w-full bg-slate-100 rounded-lg overflow-hidden", className)}>
      {allowUpload && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/90 px-3 py-2 rounded shadow-sm">
          <label className="text-sm text-muted-foreground cursor-pointer">
            选择本地 IFC
            <input
              type="file"
              accept=".ifc"
              className="hidden"
              onChange={handleUpload}
              disabled={isInitializing}
            />
          </label>
        </div>
      )}

      {(isInitializing || isLoadingModel) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-sm text-muted-foreground">
            {isInitializing ? "正在初始化模型查看器..." : "正在加载模型..."}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 backdrop-blur-sm px-4 text-center">
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}

      <div ref={containerRef} className="h-full w-full" />

      {!src && !allowUpload && !isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          未提供模型 URL，请上传 IFC 文件或在 props 中设置 src。
        </div>
      )}
    </div>
  );
}
