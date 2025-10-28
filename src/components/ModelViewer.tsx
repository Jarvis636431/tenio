import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ModelViewerProps {
  src?: string;
  allowUpload?: boolean;
  className?: string;
  highlightIds?: Array<number | string>;
  highlightColor?: string;
}

/**
 * IFC 模型查看器
 * - 依赖 web-ifc-viewer + three，本地打包
 * - wasm 文件需放置在 /public/wasm/web-ifc.wasm
 */
export function ModelViewer({
  src,
  allowUpload = false,
  className,
  highlightIds = [],
  highlightColor = "#ff9800",
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const threeRef = useRef<any>(null);
  const modelIDRef = useRef<number | null>(null);
  const highlightIdsRef = useRef<Array<number | string>>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyHighlight = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewer.IFC?.selector) return;

    const selector = viewer.IFC.selector;
    const manager = viewer.IFC.loader?.ifcManager;
    const ids = highlightIdsRef.current;

    if (typeof selector.unHighlightIfcItems === "function") {
      selector.unHighlightIfcItems();
    }

    if (!ids || ids.length === 0) {
      return;
    }

    const expressIds = ids
      .map((id) => Number(id))
      .filter((value) => Number.isFinite(value));

    if (expressIds.length === 0) {
      return;
    }

    const models = manager?.ifcModels ?? [];
    const defaultModelID = models.length > 0 ? models[models.length - 1].modelID : null;
    const modelID = modelIDRef.current ?? defaultModelID;
    if (modelID === null || modelID === undefined) return;

    const THREE = threeRef.current;
    const color =
      THREE && typeof THREE.Color === "function"
        ? new THREE.Color(highlightColor)
        : undefined;

    try {
      if (typeof selector.highlightIfcItemsByID === "function") {
        selector.highlightIfcItemsByID(modelID, expressIds, true, color);
        return;
      }
      if (typeof selector.highlightIfcItemByID === "function") {
        expressIds.forEach((expressId) =>
          selector.highlightIfcItemByID(modelID, expressId, color)
        );
        return;
      }
      if (typeof selector.pickIfcItemsByID === "function") {
        selector.pickIfcItemsByID(modelID, expressIds);
        return;
      }
    } catch (err) {
      console.error("Failed to highlight IFC items", err);
    }
  }, [highlightColor]);

  const loadModel = useCallback(
    async (url: string) => {
      if (!viewerRef.current) return;
      setIsLoadingModel(true);
      setError(null);
      try {
        const viewer = viewerRef.current;
        await viewer.IFC.loadIfcUrl(url);
        const models = viewer.IFC.loader?.ifcManager?.ifcModels ?? [];
        const latestModel = models[models.length - 1];
        modelIDRef.current = latestModel?.modelID ?? null;
        applyHighlight();
      } catch (err) {
        console.error(err);
        setError("模型加载失败，请确认 IFC 文件是否有效。");
      } finally {
        setIsLoadingModel(false);
      }
    },
    [applyHighlight]
  );

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

        threeRef.current = THREE;

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
        } else {
          const models = viewer.IFC.loader?.ifcManager?.ifcModels ?? [];
          modelIDRef.current = models.length > 0 ? models[models.length - 1].modelID : null;
          applyHighlight();
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
        if (viewerRef.current.IFC?.selector?.unHighlightIfcItems) {
          viewerRef.current.IFC.selector.unHighlightIfcItems();
        }
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [loadModel, src, applyHighlight]);

  useEffect(() => {
    if (viewerRef.current && src) {
      loadModel(src);
    }
  }, [src, loadModel]);

  useEffect(() => {
    highlightIdsRef.current = highlightIds ?? [];
    if (viewerRef.current) {
      applyHighlight();
    }
  }, [highlightIds, applyHighlight]);

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
