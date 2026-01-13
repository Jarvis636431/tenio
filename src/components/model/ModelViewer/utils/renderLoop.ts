import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type * as THREE from 'three';

type Ref<T> = { current: T };

interface StartRenderLoopParams {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controlsRef: Ref<OrbitControls | null>;
  animateIdRef: Ref<number | null>;
  abortControllerRef: Ref<AbortController | null>;
  needsRenderRef: Ref<boolean>;
}

export function startRenderLoop({
  scene,
  camera,
  renderer,
  controlsRef,
  animateIdRef,
  abortControllerRef,
  needsRenderRef,
}: StartRenderLoopParams) {
  let lastTime = 0;
  const targetFPS = 60;
  const frameInterval = 1000 / targetFPS;
  needsRenderRef.current = true;

  if (controlsRef.current) {
    controlsRef.current.addEventListener('change', () => {
      needsRenderRef.current = true;
    });
  }

  const animate = (currentTime: number) => {
    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    animateIdRef.current = requestAnimationFrame(animate);

    if (currentTime - lastTime >= frameInterval) {
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (needsRenderRef.current) {
        renderer.render(scene, camera);
        needsRenderRef.current = false;
      }

      lastTime = currentTime;
    }
  };

  animate(0);
}
