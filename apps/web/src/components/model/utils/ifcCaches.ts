import { IFCPRODUCT } from "web-ifc";
import type { IFCLoader } from "web-ifc-three/IFCLoader";

type Ref<T> = { current: T };

type ExpressIdIndexMap = Map<number, { [materialID: number]: number[] }>;
type IfcEntityProps = {
  GlobalId?: { value?: string };
  Tag?: { value?: string } | string;
};
type SpatialNode = {
  expressID?: number;
  items?: { expressID?: number }[];
  children?: SpatialNode[];
};

interface TypedIfcManager {
  getAllItemsOfType(modelID: number, type: number, verbose: boolean): Promise<Iterable<number>>;
  getSpatialStructure(modelID: number, includeProperties: boolean): Promise<SpatialNode>;
  getItemProperties(
    modelID: number,
    expressID: number,
    recursive: boolean,
  ): Promise<IfcEntityProps>;
  subsets?: {
    items?: {
      generateGeometryIndexMap(modelID: number): void;
      map: Record<number, { map?: ExpressIdIndexMap } | undefined>;
    };
  };
}

function getIfcManager(ifcLoader: IFCLoader): TypedIfcManager {
  return ifcLoader.ifcManager as unknown as TypedIfcManager;
}

async function collectProductIds(ifcLoader: IFCLoader, modelID: number): Promise<number[]> {
  const ifcManager = getIfcManager(ifcLoader);
  const rawIds = await ifcManager.getAllItemsOfType(modelID, IFCPRODUCT, true);
  let allProductIds = Array.from(rawIds);

  if (allProductIds.length) {
    return allProductIds;
  }

  try {
    const spatial = await ifcManager.getSpatialStructure(modelID, true);
    const idsSet = new Set<number>();
    const collect = (node: SpatialNode) => {
      if (typeof node.expressID === "number") idsSet.add(node.expressID);
      if (Array.isArray(node.items)) {
        for (const it of node.items) {
          if (typeof it.expressID === "number") idsSet.add(it.expressID);
        }
      }
      if (Array.isArray(node.children)) {
        for (const ch of node.children) collect(ch);
      }
    };
    collect(spatial);
    allProductIds = Array.from(idsSet);
    console.log("[ModelViewer] 通过空间结构获取产品总数:", allProductIds.length);
  } catch (se) {
    console.warn("[ModelViewer] 通过空间结构收集ID失败:", se);
  }

  return allProductIds;
}

interface BuildIdCachesParams {
  ifcLoader: IFCLoader;
  modelID: number;
  productIdsRef: Ref<number[] | null>;
  globalIdMapRef: Ref<Map<string, number> | null>;
  globalIdMapModelIdRef: Ref<number | null>;
  productIndexReadyRef: Ref<boolean>;
  expressIdIndexMapRef: Ref<ExpressIdIndexMap | null>;
}

export async function buildIdCaches({
  ifcLoader,
  modelID,
  productIdsRef,
  globalIdMapRef,
  globalIdMapModelIdRef,
  productIndexReadyRef,
  expressIdIndexMapRef,
}: BuildIdCachesParams) {
  if (
    productIdsRef.current &&
    globalIdMapRef.current &&
    globalIdMapModelIdRef.current === modelID
  ) {
    return;
  }

  const ifcManager = getIfcManager(ifcLoader);
  const allProductIds = await collectProductIds(ifcLoader, modelID);

  console.log("[ModelViewer] 产品总数:", allProductIds.length);

  if (!allProductIds.length) {
    productIndexReadyRef.current = false;
    return;
  }

  const globalIdToExpressId = new Map<string, number>();
  for (const expressID of allProductIds) {
    const props = await ifcManager.getItemProperties(modelID, expressID, false);
    const gid = props?.GlobalId?.value;
    if (gid) {
      globalIdToExpressId.set(gid, expressID);
    }
  }

  productIdsRef.current = allProductIds;
  globalIdMapRef.current = globalIdToExpressId;
  globalIdMapModelIdRef.current = modelID;
  productIndexReadyRef.current = true;
  console.log("[ModelViewer] 已映射GlobalId数量:", globalIdToExpressId.size);

  if (ifcManager.subsets?.items) {
    ifcManager.subsets.items.generateGeometryIndexMap(modelID);
    expressIdIndexMapRef.current = ifcManager.subsets.items.map[modelID]?.map ?? null;
    if (!expressIdIndexMapRef.current) {
      console.warn("[ModelViewer] ExpressId 索引映射不可用");
    }
  }
}

export async function buildGlobalIdMap(
  ifcLoader: IFCLoader,
  modelID: number,
): Promise<Map<string, number>> {
  const ifcManager = getIfcManager(ifcLoader);
  const allProductIds = await collectProductIds(ifcLoader, modelID);

  const globalIdToExpressId = new Map<string, number>();
  for (const expressID of allProductIds) {
    const props = await ifcManager.getItemProperties(modelID, expressID, false);
    const gid = props?.GlobalId?.value;
    if (gid) {
      globalIdToExpressId.set(gid, expressID);
    }
  }

  return globalIdToExpressId;
}

export async function buildTagMap(
  ifcLoader: IFCLoader,
  modelID: number,
): Promise<Record<string, string[]>> {
  const ifcManager = getIfcManager(ifcLoader);
  const allProductIds = await collectProductIds(ifcLoader, modelID);

  const tagToGlobalIds: Record<string, string[]> = {};
  for (const expressID of allProductIds) {
    const props = await ifcManager.getItemProperties(modelID, expressID, false);
    const gid = props?.GlobalId?.value;
    const rawTag =
      typeof props?.Tag === "string"
        ? props.Tag
        : (props?.Tag as { value?: string } | undefined)?.value;
    const tag = rawTag?.trim();
    if (gid && tag) {
      if (!tagToGlobalIds[tag]) tagToGlobalIds[tag] = [];
      tagToGlobalIds[tag].push(gid);
    }
  }

  return tagToGlobalIds;
}
