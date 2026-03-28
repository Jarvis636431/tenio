import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Ref<T> = { current: T };

interface SetupCameraParams {
  model: THREE.Object3D;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controlsRef: Ref<OrbitControls | null>;
  sceneRef: Ref<THREE.Scene | null>;
  cameraRef: Ref<THREE.PerspectiveCamera | null>;
  rendererRef: Ref<THREE.WebGLRenderer | null>;
}

export function setupCameraAndControls({
  model,
  camera,
  renderer,
  controlsRef,
  sceneRef,
  cameraRef,
  rendererRef,
}: SetupCameraParams) {
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

  controls.maxDistance = cameraDistance * 3;
  controls.minDistance = maxDim * 0.1;

  controlsRef.current = controls;
  sceneRef.current?.add(model);
  cameraRef.current = camera;
  rendererRef.current = renderer;
}
