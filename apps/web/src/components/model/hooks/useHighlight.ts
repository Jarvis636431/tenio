import { useCallback, useRef } from "react";
import * as THREE from "three";
import type { IFCLoader } from "web-ifc-three/IFCLoader";

type Ref<T> = { current: T };

export interface HighlightGroup {
  ids: Array<number | string>;
  color: string;
  opacity?: number;
  customID: string;
}

interface UseHighlightParams {
  highlightGroups?: HighlightGroup[];
  highlightIds: Array<number | string>;
  highlightColor: string;
  ifcLoaderRef: Ref<IFCLoader | null>;
  modelRef: Ref<(THREE.Object3D & { modelID: number }) | null>;
  globalIdMapRef: Ref<Map<string, number> | null>;
  globalIdMapModelIdRef: Ref<number | null>;
  productIdsRef: Ref<number[] | null>;
  productIndexReadyRef: Ref<boolean>;
  highlightSubsetRef: Ref<(THREE.Mesh & { renderOrder: number }) | null>;
  highlightSubsetsRef: Ref<Map<string, THREE.Mesh & { renderOrder: number }>>;
  highlightRetryTimeoutRef: Ref<number | null>;
  needsRenderRef: Ref<boolean>;
  maxHighlightRetry: number;
  highlightRetryDelay: number;
}

export function useHighlight({
  highlightGroups,
  highlightIds,
  highlightColor,
  ifcLoaderRef,
  modelRef,
  globalIdMapRef,
  globalIdMapModelIdRef,
  productIdsRef,
  productIndexReadyRef,
  highlightSubsetRef,
  highlightSubsetsRef,
  highlightRetryTimeoutRef,
  needsRenderRef,
  maxHighlightRetry,
  highlightRetryDelay,
}: UseHighlightParams) {
  const applyHighlightRef = useRef<
    ((model: THREE.Object3D & { modelID: number }, attempt?: number) => void) | null
  >(null);

  const scheduleHighlightRetry = useCallback(
    (nextAttempt: number) => {
      if (highlightRetryTimeoutRef.current) {
        clearTimeout(highlightRetryTimeoutRef.current);
      }
      highlightRetryTimeoutRef.current = window.setTimeout(() => {
        highlightRetryTimeoutRef.current = null;
        if (modelRef.current && applyHighlightRef.current) {
          void applyHighlightRef.current(modelRef.current, nextAttempt);
        }
      }, highlightRetryDelay);
    },
    [highlightRetryDelay, highlightRetryTimeoutRef, modelRef],
  );

  const applyHighlight = useCallback(
    (model: THREE.Object3D & { modelID: number }, attempt = 0) => {
      const hasHighlightRequest =
        (highlightGroups && highlightGroups.length > 0) ||
        (Array.isArray(highlightIds) && highlightIds.length > 0);

      const ifcLoader = ifcLoaderRef.current;
      if (!ifcLoader) return;

      try {
        const modelID = model.modelID;
        console.log("[ModelViewer] 开始应用高亮，模型ID:", modelID);

        if (!hasHighlightRequest) {
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
          console.log("[ModelViewer] 当前没有高亮ID，等待后续更新");
          needsRenderRef.current = true;
          return;
        }

        const globalIdToExpressId = globalIdMapRef.current;
        if (
          globalIdMapModelIdRef.current !== modelID ||
          !productIdsRef.current ||
          !globalIdToExpressId
        ) {
          productIndexReadyRef.current = false;
          if (attempt >= maxHighlightRetry) {
            console.warn("[ModelViewer] 构件索引尚未准备好，放弃高亮");
            return;
          }
          console.warn("[ModelViewer] 构件索引尚未准备好，稍后重试 (attempt %d)", attempt + 1);
          scheduleHighlightRetry(attempt + 1);
          needsRenderRef.current = true;
          return;
        }

        if (highlightGroups && highlightGroups.length > 0) {
          highlightSubsetsRef.current.forEach((subset) => {
            if (modelRef.current) {
              modelRef.current.remove(subset);
            }
          });
          highlightSubsetsRef.current.clear();

          highlightGroups.forEach((group, index) => {
            const idsToHighlight: number[] = [];
            for (const id of group.ids) {
              if (typeof id === "number") {
                idsToHighlight.push(id);
              } else if (typeof id === "string") {
                const isPureNumber = /^\d+$/.test(id.trim());
                if (isPureNumber) {
                  idsToHighlight.push(parseInt(id, 10));
                } else {
                  const expressId = globalIdToExpressId?.get(id);
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
            } as {
              modelID: number;
              ids: number[];
              material: THREE.Material;
              removePrevious: boolean;
              customID: string;
            });

            if (subset) {
              subset.renderOrder = index + 1;
              model.add(subset);
              highlightSubsetsRef.current.set(group.customID, subset);
              console.log(
                `[ModelViewer] 创建高亮组 ${group.customID} 成功，数量:`,
                idsToHighlight.length,
              );
            }
          });

          needsRenderRef.current = true;
          return;
        }

        if (!globalIdToExpressId || globalIdToExpressId.size === 0) {
          productIndexReadyRef.current = false;
          if (attempt >= maxHighlightRetry) {
            console.warn("[ModelViewer] GlobalId 映射始终为空，放弃高亮");
            return;
          }
          console.warn("[ModelViewer] GlobalId 映射为空，稍后重试 (attempt %d)", attempt + 1);
          scheduleHighlightRetry(attempt + 1);
          return;
        }

        if (!productIndexReadyRef.current) {
          productIndexReadyRef.current = true;
        }

        const idsToHighlight: number[] = [];
        for (const id of highlightIds) {
          if (typeof id === "number") {
            idsToHighlight.push(id);
          } else if (typeof id === "string") {
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

        console.log("[ModelViewer] 需要高亮的ExpressIds:", idsToHighlight);

        const highlightMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(highlightColor),
          transparent: true,
          opacity: 0.8,
          depthWrite: true,
          depthTest: true,
          metalness: 0,
          roughness: 0.6,
        });

        const subset = ifcLoader.ifcManager.createSubset({
          modelID,
          ids: idsToHighlight,
          material: highlightMaterial,
          removePrevious: true,
          customID: "highlight",
        } as {
          modelID: number;
          ids: number[];
          material: THREE.Material;
          removePrevious: boolean;
          customID: string;
        });

        if (subset) {
          subset.renderOrder = 1;
          model.add(subset);
          highlightSubsetRef.current = subset;
          console.log("[ModelViewer] 创建高亮子集成功，数量:", idsToHighlight.length);
        } else {
          console.warn("[ModelViewer] 创建高亮子集失败");
        }

        needsRenderRef.current = true;
      } catch (error) {
        console.error("[ModelViewer] 应用高亮时出错:", error);
      }
    },
    [
      highlightGroups,
      highlightIds,
      highlightColor,
      ifcLoaderRef,
      modelRef,
      globalIdMapRef,
      globalIdMapModelIdRef,
      productIdsRef,
      productIndexReadyRef,
      highlightSubsetRef,
      highlightSubsetsRef,
      needsRenderRef,
      maxHighlightRetry,
      scheduleHighlightRetry,
    ],
  );

  applyHighlightRef.current = applyHighlight;

  return { applyHighlight };
}
