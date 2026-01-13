import type * as THREE from 'three';

type Ref<T> = { current: T };

interface HandleResizeParams {
  containerRef: Ref<HTMLDivElement | null>;
  rendererRef: Ref<THREE.WebGLRenderer | null>;
  cameraRef: Ref<THREE.PerspectiveCamera | null>;
}

export function handleResize({
  containerRef,
  rendererRef,
  cameraRef,
}: HandleResizeParams) {
  if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;

  const container = containerRef.current;
  const camera = cameraRef.current;
  const renderer = rendererRef.current;

  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
