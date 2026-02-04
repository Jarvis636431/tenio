import { IFCPRODUCT } from 'web-ifc';
import type { IFCLoader } from 'web-ifc-three/IFCLoader';

type Ref<T> = { current: T };

type ExpressIdIndexMap = Map<number, { [materialID: number]: number[] }>;

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
  if (productIdsRef.current && globalIdMapRef.current && globalIdMapModelIdRef.current === modelID) {
    return;
  }

  const rawIds = await ifcLoader.ifcManager.getAllItemsOfType(
    modelID,
    IFCPRODUCT,
    true
  );
  let allProductIds: number[] = Array.isArray(rawIds)
    ? (rawIds as number[])
    : Array.from(rawIds as Iterable<number>);

  console.log('[ModelViewer] 产品总数:', allProductIds.length);

  if (!allProductIds.length) {
    try {
      const spatial = await ifcLoader.ifcManager.getSpatialStructure(
        modelID,
        true
      );
      const idsSet = new Set<number>();
      const collect = (node: { expressID?: number; items?: { expressID?: number }[]; children?: unknown[] }) => {
        if (!node) return;
        if (typeof node.expressID === 'number') idsSet.add(node.expressID);
        if (Array.isArray(node.items)) {
          for (const it of node.items) {
            if (typeof it?.expressID === 'number') idsSet.add(it.expressID);
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
    return;
  }

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

  productIdsRef.current = allProductIds;
  globalIdMapRef.current = globalIdToExpressId;
  globalIdMapModelIdRef.current = modelID;
  productIndexReadyRef.current = true;
  console.log('[ModelViewer] 已映射GlobalId数量:', globalIdToExpressId.size);

  if (ifcLoader.ifcManager.subsets?.items) {
    ifcLoader.ifcManager.subsets.items.generateGeometryIndexMap(modelID);
    expressIdIndexMapRef.current = ifcLoader.ifcManager.subsets.items.map[modelID]?.map ?? null;
    if (!expressIdIndexMapRef.current) {
      console.warn('[ModelViewer] ExpressId 索引映射不可用');
    }
  }
}

export async function buildGlobalIdMap(
  ifcLoader: IFCLoader,
  modelID: number,
): Promise<Map<string, number>> {
  const rawIds = await ifcLoader.ifcManager.getAllItemsOfType(
    modelID,
    IFCPRODUCT,
    true,
  );
  let allProductIds: number[] = Array.isArray(rawIds)
    ? (rawIds as number[])
    : Array.from(rawIds as Iterable<number>);

  if (!allProductIds.length) {
    try {
      const spatial = await ifcLoader.ifcManager.getSpatialStructure(
        modelID,
        true,
      );
      const idsSet = new Set<number>();
      const collect = (node: { expressID?: number; items?: { expressID?: number }[]; children?: unknown[] }) => {
        if (!node) return;
        if (typeof node.expressID === 'number') idsSet.add(node.expressID);
        if (Array.isArray(node.items)) {
          for (const it of node.items) {
            if (typeof it?.expressID === 'number') idsSet.add(it.expressID);
          }
        }
        if (Array.isArray(node.children)) {
          for (const ch of node.children) collect(ch);
        }
      };
      collect(spatial);
      allProductIds = Array.from(idsSet);
    } catch (se) {
      console.warn('[ModelViewer] 通过空间结构收集ID失败:', se);
    }
  }

  const globalIdToExpressId = new Map<string, number>();
  for (const expressID of allProductIds) {
    const props: { GlobalId?: { value?: string } } = await ifcLoader.ifcManager.getItemProperties(
      modelID,
      expressID,
      false,
    );
    const gid = props?.GlobalId?.value as string | undefined;
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
  const rawIds = await ifcLoader.ifcManager.getAllItemsOfType(
    modelID,
    IFCPRODUCT,
    true,
  );
  let allProductIds: number[] = Array.isArray(rawIds)
    ? (rawIds as number[])
    : Array.from(rawIds as Iterable<number>);

  if (!allProductIds.length) {
    try {
      const spatial = await ifcLoader.ifcManager.getSpatialStructure(
        modelID,
        true,
      );
      const idsSet = new Set<number>();
      const collect = (node: { expressID?: number; items?: { expressID?: number }[]; children?: unknown[] }) => {
        if (!node) return;
        if (typeof node.expressID === 'number') idsSet.add(node.expressID);
        if (Array.isArray(node.items)) {
          for (const it of node.items) {
            if (typeof it?.expressID === 'number') idsSet.add(it.expressID);
          }
        }
        if (Array.isArray(node.children)) {
          for (const ch of node.children) collect(ch);
        }
      };
      collect(spatial);
      allProductIds = Array.from(idsSet);
    } catch (se) {
      console.warn('[ModelViewer] 通过空间结构收集ID失败:', se);
    }
  }

  const tagToGlobalIds: Record<string, string[]> = {};
  for (const expressID of allProductIds) {
    const props: { GlobalId?: { value?: string }; Tag?: { value?: string } | string } =
      await ifcLoader.ifcManager.getItemProperties(modelID, expressID, false);
    const gid = props?.GlobalId?.value as string | undefined;
    const rawTag =
      typeof props?.Tag === 'string'
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
