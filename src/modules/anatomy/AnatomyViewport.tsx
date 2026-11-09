import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AnatomyLayerSettings, AnatomyStructureId } from './anatomyTypes';
import { buildAnatomyFigureModel, AnatomyModelResult } from './anatomyModelBuilder';
import { CameraPreset } from '../pose-studio/types';
import { ANATOMY_STRUCTURES } from './anatomyData';

interface AnatomyViewportProps {
  settings: AnatomyLayerSettings;
  activePreset: CameraPreset | null;
  onSelectStructure: (id: AnatomyStructureId | null) => void;
  onPresetHandled: () => void;
}

interface ScreenLabelPin {
  id: AnatomyStructureId;
  name: string;
  category: 'muscle' | 'bone';
  x: number;
  y: number;
  visible: boolean;
}

export const AnatomyViewport: React.FC<AnatomyViewportProps> = ({
  settings,
  activePreset,
  onSelectStructure,
  onPresetHandled,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelResultRef = useRef<AnatomyModelResult | null>(null);

  const [screenPins, setScreenPins] = useState<ScreenLabelPin[]>([]);

  // Smooth camera interpolation targets
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetControlsCenterRef = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x131417);
    scene.fog = new THREE.Fog(0x131417, 5, 18);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 1.25, 3.2);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Procedural Studio Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 1.0;
    controls.maxDistance = 7.5;
    controls.target.set(0, 0.95, 0); // Center on torso
    controls.update();

    // 6. Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    keyLight.position.set(2.5, 3.2, 2.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 10;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xb0c8f0, 0x18181c, 0.85);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x40c4ff, 1.4);
    rimLight.position.set(-2.5, 2.5, -2.8);
    scene.add(rimLight);

    // 7. Ground Plane
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x15161a,
      roughness: 0.85,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    const grid = new THREE.GridHelper(6, 12, 0x3b82f6, 0x24262c);
    grid.position.y = 0.001;
    scene.add(grid);

    // 8. Anatomy Model (Male or Female organic figure)
    const modelResult = buildAnatomyFigureModel(settings.gender || 'male');
    modelResultRef.current = modelResult;
    scene.add(modelResult.root);

    // Apply initial settings
    modelResult.updateLayers(settings);

    // 9. Raycasting on Tap / Click
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(modelResult.root.children, true);
      for (const hit of intersects) {
        if (hit.object.userData?.isAnatomy && hit.object.userData.structureId) {
          const id = hit.object.userData.structureId as AnatomyStructureId;
          onSelectStructure(id);
          return;
        }
      }

      onSelectStructure(null);
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Animation & Label Projection Loop
    let frameId = 0;
    const tempVec = new THREE.Vector3();

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Smooth camera interpolation toward preset
      if (targetCamPosRef.current && camera) {
        camera.position.lerp(targetCamPosRef.current, 0.1);
        if (targetControlsCenterRef.current && controls) {
          controls.target.lerp(targetControlsCenterRef.current, 0.1);
        }
        if (camera.position.distanceTo(targetCamPosRef.current) < 0.02) {
          targetCamPosRef.current = null;
          targetControlsCenterRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Project 3D structure landmark pins to 2D screen coordinates
      if (settings.showLabels && container) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const pins: ScreenLabelPin[] = [];

        // Project prominent structures
        const landmarks: AnatomyStructureId[] = [
          'deltoids',
          'pectoralis',
          'biceps',
          'abdominals',
          'quadriceps',
          'cranium',
          'ribcage',
          'pelvis',
        ];

        landmarks.forEach((id) => {
          const pos = modelResult.getStructureWorldPosition(id);
          if (pos) {
            tempVec.copy(pos);
            tempVec.project(camera);

            // Is in front of camera
            const isVisible = tempVec.z < 1.0;
            const sx = ((tempVec.x + 1) / 2) * w;
            const sy = ((-tempVec.y + 1) / 2) * h;

            const info = ANATOMY_STRUCTURES[id];
            if (info) {
              pins.push({
                id,
                name: info.name,
                category: info.category,
                x: sx,
                y: sy,
                visible: isVisible,
              });
            }
          }
        });

        setScreenPins(pins);
      } else {
        setScreenPins([]);
      }
    };

    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      controls.dispose();

      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync Layer Updates & Gender Rebuild
  useEffect(() => {
    if (
      sceneRef.current &&
      modelResultRef.current &&
      modelResultRef.current.root.name !== `AnatomyRoot_${settings.gender}`
    ) {
      sceneRef.current.remove(modelResultRef.current.root);
      const updated = buildAnatomyFigureModel(settings.gender);
      modelResultRef.current = updated;
      sceneRef.current.add(updated.root);
    }

    if (modelResultRef.current) {
      modelResultRef.current.updateLayers(settings);
    }
  }, [settings]);

  // Handle Camera Presets
  useEffect(() => {
    if (!activePreset || !cameraRef.current) return;

    const targetCenter = new THREE.Vector3(0, 0.95, 0);
    targetControlsCenterRef.current = targetCenter;

    const dist = 3.2;

    switch (activePreset) {
      case 'front':
        targetCamPosRef.current = new THREE.Vector3(0, 0.95, dist);
        break;
      case 'back':
        targetCamPosRef.current = new THREE.Vector3(0, 0.95, -dist);
        break;
      case 'left':
        targetCamPosRef.current = new THREE.Vector3(-dist, 0.95, 0);
        break;
      case 'right':
        targetCamPosRef.current = new THREE.Vector3(dist, 0.95, 0);
        break;
      case 'top':
        targetCamPosRef.current = new THREE.Vector3(0, dist + 0.95, 0.01);
        break;
      case 'isometric':
        targetCamPosRef.current = new THREE.Vector3(2.2, 2.2, 2.2);
        break;
      case 'reset':
      default:
        targetCamPosRef.current = new THREE.Vector3(0, 1.25, 3.2);
        break;
    }

    onPresetHandled();
  }, [activePreset, onPresetHandled]);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden select-none">
      <div
        ref={mountRef}
        className="w-full h-full overflow-hidden touch-none select-none bg-[#131417]"
      />

      {/* 3D Anatomical Callout Pins */}
      {settings.showLabels && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {screenPins.map(
            (pin) =>
              pin.visible && (
                <div
                  key={pin.id}
                  style={{
                    left: `${pin.x}px`,
                    top: `${pin.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute pointer-events-auto flex items-center gap-1.5 transition-all duration-75"
                >
                  <button
                    onClick={() => onSelectStructure(pin.id)}
                    className="flex items-center gap-1 bg-[#1e2025]/90 hover:bg-blue-600 border border-[#2e323b] hover:border-blue-400 text-neutral-100 hover:text-white px-2 py-0.5 rounded-full shadow-lg text-[10px] font-medium backdrop-blur-sm transition active:scale-95"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        pin.category === 'muscle' ? 'bg-red-400' : 'bg-amber-300'
                      }`}
                    />
                    <span>{pin.name}</span>
                  </button>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
};
