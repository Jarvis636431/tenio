import * as THREE from 'three';
import type { IFCLoader } from 'web-ifc-three/IFCLoader';

type Ref<T> = { current: T };

type SelectableModel = THREE.Object3D & { modelID: number };

interface SetupInteractionParams {
  ifcLoader: IFCLoader;
  model: SelectableModel;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycasterRef: Ref<THREE.Raycaster | null>;
  mouseRef: Ref<THREE.Vector2 | null>;
  infoDivRef: Ref<HTMLDivElement | null>;
  selectionSubsetRef: Ref<(THREE.Mesh & { renderOrder: number }) | null>;
  modelRef: Ref<SelectableModel | null>;
  clickHandlerRef: Ref<((event: MouseEvent) => void) | null>;
  clickTargetRef: Ref<HTMLCanvasElement | null>;
}

export function setupInteraction({
  ifcLoader,
  model,
  camera,
  renderer,
  raycasterRef,
  mouseRef,
  infoDivRef,
  selectionSubsetRef,
  modelRef,
  clickHandlerRef,
  clickTargetRef,
}: SetupInteractionParams) {
  raycasterRef.current = new THREE.Raycaster();
  mouseRef.current = new THREE.Vector2();

  const handleClick = async (event: MouseEvent) => {
    if (!renderer || !camera || !raycasterRef.current) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    mouseRef.current!.set(x, y);

    raycasterRef.current.setFromCamera(mouseRef.current!, camera);
    const targets: THREE.Object3D[] = modelRef.current ? [modelRef.current] : [];
    const intersects = raycasterRef.current.intersectObjects(targets, true);

    if (!intersects.length) {
      if (infoDivRef.current) infoDivRef.current.textContent = '未选中构件';
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

  if (clickHandlerRef.current && clickTargetRef.current) {
    clickTargetRef.current.removeEventListener('click', clickHandlerRef.current);
  }
  clickHandlerRef.current = handleClick;
  clickTargetRef.current = renderer.domElement;
  renderer.domElement.addEventListener('click', handleClick);
}
