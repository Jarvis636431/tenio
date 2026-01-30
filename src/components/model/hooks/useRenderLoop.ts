import { useCallback } from 'react';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type * as THREE from 'three';

type Ref<T> = { current: T };

interface UseRenderLoopParams {
  controlsRef: Ref<OrbitControls | null>;
  animateIdRef: Ref<number | null>;
  abortControllerRef: Ref<AbortController | null>;
  needsRenderRef: Ref<boolean>;
}

export function useRenderLoop({
  controlsRef,
  animateIdRef,
  abortControllerRef,
  needsRenderRef,
}: UseRenderLoopParams) {
  const startRenderLoop = useCallback((
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) => {
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
  }, [controlsRef, animateIdRef, abortControllerRef, needsRenderRef]);

  return { startRenderLoop };
}
