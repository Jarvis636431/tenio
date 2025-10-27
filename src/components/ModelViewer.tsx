import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ModelViewerProps {
  src?: string;
  allowUpload?: boolean;
  className?: string;
}

/**
 * IFC 模型查看器
 * - 依赖 web-ifc-viewer + three，本地打包
 * - wasm 文件需放置在 /public/wasm/web-ifc.wasm
 */
export function ModelViewer({ src, allowUpload = false, className }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModel = useCallback(async (url: string) => {
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
  }, []);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    let disposed = false;

    const initViewer = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        const [{ IfcViewerAPI }, THREE] = await Promise.all([
          import("web-ifc-viewer"),
          import("three"),
        ]);

        if (disposed || !containerRef.current) return;

        const viewer = new IfcViewerAPI({
          container: containerRef.current,
          backgroundColor: new THREE.Color("#f0f0f0"),
        });

        viewer.axes.setAxes();
        viewer.grid.setGrid();
        viewer.IFC.setWasmPath("/wasm/");

        viewerRef.current = viewer;

        if (src) {
          await loadModel(src);
        }
      } catch (err) {
        console.error(err);
        setError("初始化模型查看器失败，请确认依赖是否正确安装。");
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
  }, [loadModel, src]);

  useEffect(() => {
    if (viewerRef.current && src) {
      loadModel(src);
    }
  }, [src, loadModel]);

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
