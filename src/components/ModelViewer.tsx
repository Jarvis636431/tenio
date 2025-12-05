import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import * as THREE from 'three';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { IFCPRODUCT } from 'web-ifc';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface HighlightGroup {
  ids: Array<number | string>;
  color: string;
  opacity?: number;
  customID: string;
}

interface ModelViewerProps {
  src?: string;
  allowUpload?: boolean;
  className?: string;
  highlightIds?: Array<number | string>;
  highlightColor?: string;
  baseColor?: string;
  // 新增：支持多组高亮
  highlightGroups?: HighlightGroup[];
}

export function ModelViewer({
  src,
  allowUpload = false,
  className,
  highlightIds = [],
  highlightColor = "#ff9800",
  baseColor = "#808080",
  highlightGroups,
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animateIdRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ifcLoaderRef = useRef<IFCLoader | null>(null);
const modelRef = useRef<(THREE.Object3D & { modelID: number }) | null>(null);
const productIndexReadyRef = useRef(false);
const highlightRetryTimeoutRef = useRef<number | null>(null);
const MAX_HIGHLIGHT_RETRY = 20;
const HIGHLIGHT_RETRY_DELAY = 750;
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2 | null>(null);
  const infoDivRef = useRef<HTMLDivElement | null>(null);
  const selectionSubsetRef = useRef<(THREE.Mesh & { renderOrder: number }) | null>(null);
  const highlightSubsetRef = useRef<(THREE.Mesh & { renderOrder: number }) | null>(null);
  const highlightSubsetsRef = useRef<Map<string, THREE.Mesh & { renderOrder: number }>>(new Map());

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 清理函数
  const cleanup = useCallback(() => {
    console.log('[ModelViewer] 开始清理资源');
    
    // 取消动画循环
    if (animateIdRef.current) {
      cancelAnimationFrame(animateIdRef.current);
      animateIdRef.current = null;
    }

    // 取消网络请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 清理Three.js资源
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }

    // 清理容器
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // 重置refs
    sceneRef.current = null;
    cameraRef.current = null;
    modelRef.current = null;
    raycasterRef.current = null;
    mouseRef.current = null;
    infoDivRef.current = null;
    selectionSubsetRef.current = null;
    highlightSubsetRef.current = null;
    highlightSubsetsRef.current.clear();
    if (ifcLoaderRef.current) {
      try {
        ifcLoaderRef.current.ifcManager?.dispose();
      } catch (disposeError) {
        console.warn('[ModelViewer] 卸载IFC实例时出错:', disposeError);
      }
      ifcLoaderRef.current = null;
    }
    isInitializedRef.current = false;
    productIndexReadyRef.current = false;
    if (highlightRetryTimeoutRef.current) {
      clearTimeout(highlightRetryTimeoutRef.current);
      highlightRetryTimeoutRef.current = null;
    }

    console.log('[ModelViewer] 资源清理完成');
  }, []);

  // 初始化viewer
  const initViewer = useCallback(async () => {
    if (isInitializedRef.current || !containerRef.current || !src) {
      return;
    }

    console.log('[ModelViewer] 开始初始化viewer');
    setIsLoading(true);
    setError(null);

    try {
      // 创建新的AbortController用于取消下载
      abortControllerRef.current = new AbortController();

      const container = containerRef.current;
      container.innerHTML = '';

      // 创建场景
      const scene = new THREE.Scene();
      scene.background = null;
      scene.fog = null;

      // 创建相机
      const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.01,
        2000
      );
      camera.position.set(20, 20, 20);
      camera.lookAt(0, 0, 0);
      camera.near = 0.01;
      camera.far = 2000;
      camera.updateProjectionMatrix();

      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        alpha: true,
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // 添加光源
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      // 创建IFC加载器
      const ifcLoader = new IFCLoader();
      ifcLoader.ifcManager.setWasmPath('/wasm/');
      ifcLoaderRef.current = ifcLoader;

      // 加载模型
      await loadModel(ifcLoader, scene, camera, renderer, container);

      isInitializedRef.current = true;
      setIsLoading(false);
      console.log('[ModelViewer] Viewer初始化完成');

    } catch (err) {
      console.error('[ModelViewer] 初始化失败:', err);
      setError(err instanceof Error ? err.message : '初始化失败');
      setIsLoading(false);
    }
  }, [src]);

  // 加载模型
  const loadModel = async (
    ifcLoader: IFCLoader,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    container: HTMLDivElement
  ) => {
    try {
      console.log('[ModelViewer] 开始加载模型:', src);

      // 检查是否已被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const response = await fetch(src!, {
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error(`请求模型文件失败: ${response.status}`);
      }

      // 再次检查是否已被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const data = await response.arrayBuffer();

      // 再次检查是否已被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // TODO: 性能优化 - 使用 Web Worker 避免阻塞主线程
      // 当前问题：ifcLoader.parse() 是 CPU 密集型操作，会阻塞主线程数秒
      // 导致加载期间 UI 完全无响应（包括侧边栏点击）
      // 解决方案：
      // 1. 创建 Worker 线程执行 IFC 解析
      // 2. 通过 postMessage 传递 ArrayBuffer
      // 3. Worker 返回解析后的模型数据
      // 4. 主线程只负责渲染
      // 参考：https://github.com/IFCjs/web-ifc-three/issues/XXX
      const model = await ifcLoader.parse(data) as THREE.Object3D & { modelID: number };

      // 检查是否已被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // TODO: 性能优化 - 优化模型遍历操作
      // 当前问题：traverse() 同步遍历整个模型树，对大模型会进一步延长阻塞时间
      // 建议方案：
      // 1. 配合 Web Worker 方案，在 Worker 中完成遍历
      // 2. 或使用 requestIdleCallback 分帧处理
      // 3. 或延迟到渲染后按需处理
      // 优化模型
      model.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.computeBoundingSphere();
            child.geometry.computeBoundingBox();
          }

          if (child.material) {
            child.material.side = THREE.FrontSide;
            child.material.transparent = false;
            child.material.depthWrite = true;
            child.material.depthTest = true;

            if (child.material.map) {
              child.material.map.generateMipmaps = false;
              child.material.map.minFilter = THREE.LinearFilter;
              child.material.map.magFilter = THREE.LinearFilter;
            }
          }

          child.renderOrder = 0;
        }
      });

      // 检查是否已被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      scene.add(model);
      modelRef.current = model;

      // 创建信息面板
      if (!infoDivRef.current) {
        const info = document.createElement('div');
        info.style.position = 'absolute';
        info.style.top = '12px';
        info.style.right = '12px';
        info.style.maxWidth = '360px';
        info.style.background = 'rgba(0,0,0,0.65)';
        info.style.color = '#fff';
        info.style.padding = '10px 12px';
        info.style.borderRadius = '8px';
        info.style.fontSize = '12px';
        info.style.lineHeight = '1.4';
        info.style.pointerEvents = 'none';
        info.style.whiteSpace = 'pre-wrap';
        info.textContent = '点击构件以查看属性';
        infoDivRef.current = info;
        container.style.position = 'relative';
        container.appendChild(info);
      }

      // 应用基础材质（半透明灰色）
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        metalness: 0,
        roughness: 1,
      });
      model.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.material = baseMaterial;
          child.renderOrder = 0;
        }
      });

      // 应用高亮
      await applyHighlight(ifcLoader, model);

      // 设置相机和控制器
      setupCameraAndControls(model, camera, renderer);

      // 设置交互
      setupInteraction(ifcLoader, model, camera, renderer);

      // 开始渲染循环
      startRenderLoop(scene, camera, renderer);

      console.log('[ModelViewer] 模型加载完成');

    } catch (err) {
      console.error('[ModelViewer] 加载模型失败:', err);
      throw err;
    }
  };

  // 应用高亮
  const scheduleHighlightRetry = (nextAttempt: number) => {
    if (highlightRetryTimeoutRef.current) {
      clearTimeout(highlightRetryTimeoutRef.current);
    }
    highlightRetryTimeoutRef.current = window.setTimeout(() => {
      highlightRetryTimeoutRef.current = null;
      if (ifcLoaderRef.current && modelRef.current) {
        applyHighlight(ifcLoaderRef.current, modelRef.current as THREE.Object3D & { modelID: number }, nextAttempt);
      }
    }, HIGHLIGHT_RETRY_DELAY);
  };

  const applyHighlight = async (
    ifcLoader: IFCLoader,
    model: THREE.Object3D & { modelID: number },
    attempt = 0
  ) => {
    // 优先使用 highlightGroups，如果没有则使用旧的单组模式
    const hasHighlightRequest = 
      (highlightGroups && highlightGroups.length > 0) || 
      (Array.isArray(highlightIds) && highlightIds.length > 0);

    try {
      const modelID = model.modelID;
      console.log('[ModelViewer] 开始应用高亮，模型ID:', modelID);

      if (!hasHighlightRequest) {
        // 清理所有高亮子集
        if (highlightSubsetRef.current && modelRef.current) {
          modelRef.current.remove(highlightSubsetRef.current);
          highlightSubsetRef.current = null;
        }
        highlightSubsetsRef.current.forEach((subset) => {
          if (modelRef.current) {
            modelRef.current.remove(subset);
          }
        });
        highlightSubsetsRef.current.clear();
        console.log('[ModelViewer] 当前没有高亮ID，等待后续更新');
        return;
      }

      // 获取所有产品元素的 expressID 列表
      const rawIds = await ifcLoader.ifcManager.getAllItemsOfType(
        modelID,
        IFCPRODUCT,
        true
      );
      let allProductIds: number[] = Array.isArray(rawIds)
        ? (rawIds as number[])
        : Array.from(rawIds as Iterable<number>);

      console.log('[ModelViewer] 产品总数:', allProductIds.length);

      // 回退：通过空间结构收集 expressID
      if (!allProductIds.length) {
        try {
          const spatial = await ifcLoader.ifcManager.getSpatialStructure(
            modelID,
            true
          );
          const idsSet = new Set<number>();
          const collect = (node: { expressID?: number; items?: { expressID?: number }[]; children?: unknown[] }) => {
            if (!node) return;
            if (typeof node.expressID === 'number')
              idsSet.add(node.expressID);
            if (Array.isArray(node.items)) {
              for (const it of node.items) {
                if (typeof it?.expressID === 'number')
                  idsSet.add(it.expressID);
              }
            }
            if (Array.isArray(node.children)) {
              for (const ch of node.children) collect(ch);
            }
          };
          collect(spatial);
          allProductIds = Array.from(idsSet);
          console.log('[ModelViewer] 通过空间结构获取产品总数:', allProductIds.length);
        } catch (se) {
          console.warn('[ModelViewer] 通过空间结构收集ID失败:', se);
        }
      }

      if (!allProductIds.length) {
        productIndexReadyRef.current = false;
        if (attempt >= MAX_HIGHLIGHT_RETRY) {
          console.warn('[ModelViewer] 多次尝试后仍无法解析构件，放弃高亮');
          return;
        }
        console.warn('[ModelViewer] 构件索引尚未准备好，稍后重试 (attempt %d)', attempt + 1);
        scheduleHighlightRetry(attempt + 1);
        return;
      }

      // 建立GlobalId到ExpressId的映射
      const globalIdToExpressId = new Map<string, number>();

      for (const expressID of allProductIds) {
        const props: { GlobalId?: { value?: string } } = await ifcLoader.ifcManager.getItemProperties(
          modelID,
          expressID,
          false
        );
        const gid = props?.GlobalId?.value as string | undefined;
        if (gid) {
          globalIdToExpressId.set(gid, expressID);
        }
      }

      console.log('[ModelViewer] 已映射GlobalId数量:', globalIdToExpressId.size);

      // 如果使用多组高亮模式
      if (highlightGroups && highlightGroups.length > 0) {
        // 清理旧的子集
        highlightSubsetsRef.current.forEach((subset) => {
          if (modelRef.current) {
            modelRef.current.remove(subset);
          }
        });
        highlightSubsetsRef.current.clear();

        // 为每组创建高亮
        highlightGroups.forEach((group, index) => {
          const idsToHighlight: number[] = [];
          for (const id of group.ids) {
            if (typeof id === 'number') {
              idsToHighlight.push(id);
            } else if (typeof id === 'string') {
              const isPureNumber = /^\d+$/.test(id.trim());
              if (isPureNumber) {
                idsToHighlight.push(parseInt(id, 10));
              } else {
                const expressId = globalIdToExpressId.get(id);
                if (expressId !== undefined) {
                  idsToHighlight.push(expressId);
                }
              }
            }
          }

          if (idsToHighlight.length === 0) return;

          const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(group.color),
            transparent: true,
            opacity: group.opacity ?? 0.8,
            depthWrite: true,
            depthTest: true,
            metalness: 0,
            roughness: 0.6,
          });

          const subset = ifcLoader.ifcManager.createSubset({
            modelID,
            ids: idsToHighlight,
            material: material,
            removePrevious: false,
            customID: group.customID,
          } as { modelID: number; ids: number[]; material: THREE.Material; removePrevious: boolean; customID: string });

          if (subset) {
            (subset as THREE.Mesh & { renderOrder: number }).renderOrder = index + 1;
            model.add(subset);
            highlightSubsetsRef.current.set(group.customID, subset as THREE.Mesh & { renderOrder: number });
            console.log(`[ModelViewer] 创建高亮组 ${group.customID} 成功，数量:`, idsToHighlight.length);
          }
        });

        return;
      }

      if (globalIdToExpressId.size === 0) {
        productIndexReadyRef.current = false;
        if (attempt >= MAX_HIGHLIGHT_RETRY) {
          console.warn('[ModelViewer] GlobalId 映射始终为空，放弃高亮');
          return;
        }
        console.warn('[ModelViewer] GlobalId 映射为空，稍后重试 (attempt %d)', attempt + 1);
        scheduleHighlightRetry(attempt + 1);
        return;
      }

      if (!productIndexReadyRef.current) {
        productIndexReadyRef.current = true;
      }

      // 转换highlightIds为expressIds
      const idsToHighlight: number[] = [];
      for (const id of highlightIds) {
        if (typeof id === 'number') {
          idsToHighlight.push(id);
        } else if (typeof id === 'string') {
          const isPureNumber = /^\d+$/.test(id.trim());
          if (isPureNumber) {
            idsToHighlight.push(parseInt(id, 10));
          } else {
            const expressId = globalIdToExpressId.get(id);
            if (expressId !== undefined) {
              idsToHighlight.push(expressId);
            }
          }
        }
      }

      console.log('[ModelViewer] 需要高亮的ExpressIds:', idsToHighlight);

      // 创建高亮材质
      const highlightMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(highlightColor),
        transparent: true,
        opacity: 0.8,
        depthWrite: true,
        depthTest: true,
        metalness: 0,
        roughness: 0.6,
      });

      // 创建高亮子集
      const subset = ifcLoader.ifcManager.createSubset({
        modelID,
        ids: idsToHighlight,
        material: highlightMaterial,
        removePrevious: true,
        customID: 'highlight',
      } as { modelID: number; ids: number[]; material: THREE.Material; removePrevious: boolean; customID: string });

      if (subset) {
        (subset as THREE.Mesh & { renderOrder: number }).renderOrder = 1;
        model.add(subset);
        highlightSubsetRef.current = subset as THREE.Mesh & { renderOrder: number };
        console.log('[ModelViewer] 创建高亮子集成功，数量:', idsToHighlight.length);
      } else {
        console.warn('[ModelViewer] 创建高亮子集失败');
      }

    } catch (error) {
      console.error('[ModelViewer] 应用高亮时出错:', error);
    }
  };

  // 设置相机和控制器
  const setupCameraAndControls = (
    model: THREE.Object3D,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) => {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.8;
    controls.maxDistance = 1000;
    controls.minDistance = 1;

    // 计算模型边界并居中
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.5;

    camera.position.set(cameraDistance, cameraDistance, cameraDistance);
    camera.lookAt(0, 0, 0);

    controls.target.set(0, 0, 0);
    controls.update();

    // 调整控制器限制
    controls.maxDistance = cameraDistance * 3;
    controls.minDistance = maxDim * 0.1;

    controlsRef.current = controls;
    sceneRef.current?.add(model);
    cameraRef.current = camera;
    rendererRef.current = renderer;
  };

  // 设置交互
  const setupInteraction = (
    ifcLoader: IFCLoader,
    model: THREE.Object3D & { modelID: number },
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) => {
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    const handleClick = async (event: MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current || !raycasterRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current!.set(x, y);

      raycasterRef.current.setFromCamera(mouseRef.current!, cameraRef.current);
      const targets: THREE.Object3D[] = modelRef.current ? [modelRef.current] : [];
      const intersects = raycasterRef.current.intersectObjects(targets, true);

      if (!intersects.length) {
        if (infoDivRef.current) infoDivRef.current.textContent = '未选中构件';
        // 移除选择子集
        if (selectionSubsetRef.current && modelRef.current) {
          modelRef.current.remove(selectionSubsetRef.current);
          selectionSubsetRef.current = null;
        }
        return;
      }

      const first = intersects[0];
      if (!first.object || !('geometry' in first.object) || typeof first.faceIndex !== 'number') {
        if (infoDivRef.current) infoDivRef.current.textContent = '未选中有效面';
        return;
      }

      try {
        const geom = (first.object as THREE.Mesh).geometry as THREE.BufferGeometry;
        const expressID = ifcLoader.ifcManager.getExpressId(geom, first.faceIndex as number);
        const modelID = (first.object as THREE.Mesh & { modelID?: number }).modelID ?? model.modelID;

        if (typeof expressID !== 'number' || typeof modelID !== 'number') {
          if (infoDivRef.current) infoDivRef.current.textContent = '无法解析构件ID';
          return;
        }

        const props: {
          GlobalId?: { value?: string };
          Name?: { value?: string };
          ObjectType?: { value?: string };
          type?: string;
          PredefinedType?: { value?: string };
        } = await ifcLoader.ifcManager.getItemProperties(modelID, expressID, true);
        const gid = props?.GlobalId?.value ?? '';
        const name = props?.Name?.value ?? '';
        const type = props?.ObjectType?.value ?? props?.type ?? '';
        const predef = props?.PredefinedType?.value ?? '';

        console.log('[ModelViewer] 点击选中:', {
          expressID,
          GlobalId: gid,
          Name: name,
          Type: type,
          Predefined: predef,
        });

        if (infoDivRef.current) {
          infoDivRef.current.innerHTML =
            `<div><b>ExpressID</b>: ${expressID}</div>` +
            (gid ? `<div><b>GlobalId</b>: ${gid}</div>` : '') +
            (name ? `<div><b>Name</b>: ${name}</div>` : '') +
            (type ? `<div><b>Type</b>: ${type}</div>` : '') +
            (predef ? `<div><b>Predefined</b>: ${predef}</div>` : '');
        }

        // 创建选择子集（黄色）
        try {
          if (selectionSubsetRef.current && modelRef.current) {
            modelRef.current.remove(selectionSubsetRef.current);
            selectionSubsetRef.current = null;
          }

          const selectMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            depthTest: true,
            metalness: 0,
            roughness: 0.6,
          });

          const selectionSubset = ifcLoader.ifcManager.createSubset({
            modelID,
            ids: [expressID],
            material: selectMaterial,
            removePrevious: true,
            customID: 'select',
          } as { modelID: number; ids: number[]; material: THREE.Material; removePrevious: boolean; customID: string });

          if (selectionSubset) {
            (selectionSubset as THREE.Mesh & { renderOrder: number }).renderOrder = 2;
            model.add(selectionSubset);
            selectionSubsetRef.current = selectionSubset as THREE.Mesh & { renderOrder: number };
          }
        } catch (se) {
          console.warn('[ModelViewer] 创建选择子集失败:', se);
        }

      } catch (e) {
        if (infoDivRef.current) infoDivRef.current.textContent = '读取属性失败';
        console.warn('点击读取属性失败', e);
      }
    };

    renderer.domElement.addEventListener('click', handleClick);
  };

  // 开始渲染循环
  const startRenderLoop = (
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) => {
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    let needsRender = true;

    // 当控制器发生变化时，标记需要渲染
    if (controlsRef.current) {
      controlsRef.current.addEventListener('change', () => {
        needsRender = true;
      });
    }

    const animate = (currentTime: number) => {
      // 检查是否已被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      animateIdRef.current = requestAnimationFrame(animate);

      if (currentTime - lastTime >= frameInterval) {
        // 更新控制器
        if (controlsRef.current) {
          controlsRef.current.update();
        }

        if (needsRender) {
          renderer.render(scene, camera);
          needsRender = false;
        }

        lastTime = currentTime;
      }
    };

    animate(0);
  };

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;

    const container = containerRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }, []);

  // 初始化effect
  useEffect(() => {
    if (src) {
      initViewer();
    }

    return cleanup;
  }, [src, initViewer, cleanup]);

  // 高亮变化effect
  useEffect(() => {
    if (isInitializedRef.current && ifcLoaderRef.current && modelRef.current) {
      console.log('[ModelViewer] 高亮ID变化，重新应用高亮');
      applyHighlight(ifcLoaderRef.current, modelRef.current as THREE.Object3D & { modelID: number });
    }
  }, [highlightIds, highlightColor, highlightGroups]);

  // 窗口大小变化effect
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <div className={cn("relative w-full h-full bg-gray-50", className)}>
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">加载模型中...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center text-red-600">
            <p className="text-sm">加载失败: {error}</p>
          </div>
        </div>
      )}

      {allowUpload && !src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">请选择IFC文件</p>
            <input
              type="file"
              accept=".ifc"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
