import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraPreset, StudioLightingSettings, CharacterModelId } from './types';
import { JointName, PoseControlMode, IKTargetName, SavedPose } from './poseTypes';
import { clampJointRotation } from './poseConstraints';
import { updateLimbIK } from './ikSolver';
import { applyPoseToModel } from './poseLibrary';
import { createHumanoidRig, HumanoidRig } from './humanoidRigAdapter';
import { characterModelService } from '../../services/assets/characterModelService';

interface ThreeCanvasViewportProps {
  lighting: StudioLightingSettings;
  controlMode: PoseControlMode;
  selectedJoint: JointName | null;
  activePreset: CameraPreset | null;
  targetPoseToApply: SavedPose | null;
  customModelBuffer?: ArrayBuffer | null;
  onSelectJoint: (joint: JointName | null) => void;
  onJointRotated: (joint: JointName, rotation: { x: number; y: number; z: number }) => void;
  onPresetHandled: () => void;
  onPoseApplied: () => void;
  onCustomModelLoaded?: (name: string) => void;
}

export const ThreeCanvasViewport: React.FC<ThreeCanvasViewportProps> = ({
  lighting,
  controlMode,
  selectedJoint,
  activePreset,
  targetPoseToApply,
  customModelBuffer,
  onSelectJoint,
  onJointRotated,
  onPresetHandled,
  onPoseApplied,
  onCustomModelLoaded,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const perspCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);

  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rigRef = useRef<HumanoidRig | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // IK target meshes
  const ikTargetsRef = useRef<{
    leftHand: THREE.Mesh;
    rightHand: THREE.Mesh;
    leftFoot: THREE.Mesh;
    rightFoot: THREE.Mesh;
  } | null>(null);

  const selectedIKTargetRef = useRef<IKTargetName | null>(null);

  // Smooth camera interpolation targets
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetControlsCenterRef = useRef<THREE.Vector3 | null>(null);

  const currentLoadedModelRef = useRef<string>('');

  // 1. Initialize WebGL Viewport
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x141518);
    scene.fog = new THREE.Fog(0x141518, 5, 18);

    // 2. Cameras
    const aspect = width / height;
    const perspCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 50);
    perspCamera.position.set(0, 1.2, 3.2);
    perspCameraRef.current = perspCamera;

    const frustumSize = 2.4;
    const orthoCamera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      50
    );
    orthoCamera.position.set(0, 1.2, 3.2);
    orthoCameraRef.current = orthoCamera;

    const activeCam = lighting.cameraType === 'orthographic' ? orthoCamera : perspCamera;
    cameraRef.current = activeCam;

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
    const controls = new OrbitControls(activeCam, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 0.8;
    controls.maxDistance = 8.0;
    controls.target.set(0, 0.9, 0);
    controls.update();

    // 6. TransformControls (Rotation & Translation Gizmo)
    const transformControls = new TransformControls(activeCam, renderer.domElement);
    transformControls.size = 0.85;
    transformControls.setSpace('local');
    transformControlsRef.current = transformControls;
    scene.add(transformControls.getHelper());

    transformControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value;
    });

    transformControls.addEventListener('change', () => {
      const obj = transformControls.object;
      if (!obj) return;

      // Handle IK dragging
      if (selectedIKTargetRef.current && rigRef.current) {
        updateLimbIK(
          rigRef.current,
          selectedIKTargetRef.current,
          obj.position
        );
      }

      // Handle FK rotation on bone
      const jointName = obj.userData?.jointName as JointName | undefined;
      if (jointName) {
        const clamped = clampJointRotation(jointName, {
          x: obj.rotation.x,
          y: obj.rotation.y,
          z: obj.rotation.z,
        });
        obj.rotation.set(clamped.x, clamped.y, clamped.z);
        onJointRotated(jointName, clamped);
      }
    });

    // 7. Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff5ea, lighting.keyIntensity);
    keyLight.position.set(2, 3, 2.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 10;
    keyLight.shadow.camera.left = -1.5;
    keyLight.shadow.camera.right = 1.5;
    keyLight.shadow.camera.top = 2.2;
    keyLight.shadow.camera.bottom = -0.5;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const hemiLight = new THREE.HemisphereLight(0xb0c8f0, 0x18181c, lighting.fillIntensity);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const rimLight = new THREE.DirectionalLight(0x40c4ff, lighting.rimIntensity);
    rimLight.position.set(-2, 2.5, -2.5);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // 8. Ground Plane with Soft Contact Shadow
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x16171b,
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

    // 9. IK Target Handles (Visual glowing spheres for hands and feet)
    const createIKHandle = (color: number) => {
      const geo = new THREE.SphereGeometry(0.045, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      return mesh;
    };

    const ikTargets = {
      leftHand: createIKHandle(0x38bdf8),
      rightHand: createIKHandle(0x38bdf8),
      leftFoot: createIKHandle(0x34d399),
      rightFoot: createIKHandle(0x34d399),
    };
    ikTargetsRef.current = ikTargets;

    // 10. Raycasting for Pointer / Touch Picking
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const tempVec = new THREE.Vector3();

    const handlePointerDown = (event: PointerEvent) => {
      if (transformControls.dragging) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, cameraRef.current || perspCamera);

      // Check IK handles first if in IK mode
      if (controlMode === 'ik' && ikTargetsRef.current) {
        const handleMeshes = Object.values(ikTargetsRef.current);
        const handleHits = raycaster.intersectObjects(handleMeshes, false);
        if (handleHits.length > 0) {
          const hitObj = handleHits[0].object as THREE.Mesh;
          const targetKey = (Object.keys(ikTargetsRef.current) as IKTargetName[]).find(
            (k) => ikTargetsRef.current![k] === hitObj
          );
          if (targetKey) {
            selectedIKTargetRef.current = targetKey;
            transformControls.setMode('translate');
            transformControls.attach(hitObj);
            return;
          }
        }
      }

      // Check bone joint handle spheres, proxy hitboxes, and skinned mesh
      if (rigRef.current) {
        const rig = rigRef.current;
        const intersects = raycaster.intersectObjects(rig.root.children, true);

        // 1st priority: Magic Poser Glowing Joint Spheres
        for (const hit of intersects) {
          if (hit.object.userData?.isJointHandle && hit.object.userData.jointName) {
            const jName = hit.object.userData.jointName as JointName;
            onSelectJoint(jName);
            return;
          }
        }

        // 2nd priority: Bone proxy hitboxes
        for (const hit of intersects) {
          if (hit.object.userData?.isJoint && hit.object.userData.jointName) {
            const jName = hit.object.userData.jointName as JointName;
            onSelectJoint(jName);
            return;
          }
        }

        // 3rd priority: Ray hit on SkinnedMesh surface -> select closest bone
        for (const hit of intersects) {
          if ((hit.object as THREE.SkinnedMesh).isSkinnedMesh) {
            let closestJoint: JointName | null = null;
            let minDistance = Infinity;

            rig.bones.forEach((bone, jName) => {
              bone.getWorldPosition(tempVec);
              const dist = tempVec.distanceTo(hit.point);
              if (dist < minDistance) {
                minDistance = dist;
                closestJoint = jName;
              }
            });

            if (closestJoint && minDistance < 0.45) {
              onSelectJoint(closestJoint);
              return;
            }
          }
        }
      }

      // If clicked empty background in view mode, clear selection
      if (controlMode === 'view') {
        onSelectJoint(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Animation & Render Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      clock.getDelta();

      // Smooth camera preset interpolation
      if (targetCamPosRef.current && cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.1);
        if (targetControlsCenterRef.current && controlsRef.current) {
          controlsRef.current.target.lerp(targetControlsCenterRef.current, 0.1);
        }
        if (cameraRef.current.position.distanceTo(targetCamPosRef.current) < 0.02) {
          targetCamPosRef.current = null;
          targetControlsCenterRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, cameraRef.current || perspCamera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const newAspect = w / h;

      if (perspCameraRef.current) {
        perspCameraRef.current.aspect = newAspect;
        perspCameraRef.current.updateProjectionMatrix();
      }

      if (orthoCameraRef.current) {
        orthoCameraRef.current.left = (frustumSize * newAspect) / -2;
        orthoCameraRef.current.right = (frustumSize * newAspect) / 2;
        orthoCameraRef.current.top = frustumSize / 2;
        orthoCameraRef.current.bottom = frustumSize / -2;
        orthoCameraRef.current.updateProjectionMatrix();
      }

      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // File Drag and Drop for custom GLB models
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
        try {
          setIsLoadingModel(true);
          const buffer = await characterModelService.readFileAsArrayBuffer(file);
          if (onCustomModelLoaded) {
            onCustomModelLoaded(file.name);
          }
          await loadCharacterModel('custom', buffer);
        } catch (err) {
          console.error('Failed to load dropped GLB model:', err);
          setLoadError('Failed to load dropped 3D model.');
        } finally {
          setIsLoadingModel(false);
        }
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      controls.dispose();
      transformControls.dispose();

      if (rigRef.current) {
        rigRef.current.dispose();
      }

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

  // Helper to load or replace character model
  const loadCharacterModel = async (
    modelId: CharacterModelId,
    customBuffer?: ArrayBuffer | null
  ) => {
    const scene = sceneRef.current;
    if (!scene) return;

    try {
      setIsLoadingModel(true);
      setLoadError(null);

      // Remove existing rig if present
      if (rigRef.current) {
        scene.remove(rigRef.current.root);
        rigRef.current.dispose();
        rigRef.current = null;
      }

      // Load new model via characterModelService
      const modelRoot = await characterModelService.loadCharacter(
        modelId,
        customBuffer || undefined
      );

      // Create HumanoidRig
      const rig = createHumanoidRig(modelRoot, modelId === 'female' ? 'female' : 'male');
      rigRef.current = rig;
      scene.add(rig.root);

      // Apply initial relaxed natural A-pose by default
      const { BUILTIN_POSES } = await import('./poseLibrary');
      applyPoseToModel(rig, BUILTIN_POSES[0]);

      // Apply initial shading mode
      rig.setShadingMode(lighting.shadingMode);

      // Set joint spheres visibility
      rig.setJointHandlesVisible(lighting.jointSpheresVisible !== false);

      // Highlight selected joint if present
      if (selectedJoint) {
        rig.highlightJoint(selectedJoint);
      }

      // Sync IK handles
      syncIKHandles(rig);

      currentLoadedModelRef.current = modelId === 'custom' ? 'custom' : modelId;
    } catch (err) {
      console.error('Error loading character model:', err);
      setLoadError('Failed to load 3D character model.');
    } finally {
      setIsLoadingModel(false);
    }
  };

  const syncIKHandles = (rig: HumanoidRig) => {
    if (!ikTargetsRef.current) return;
    const pos = new THREE.Vector3();
    const leftHandBone = rig.getBone('leftWrist') || rig.getBone('leftHand');
    if (leftHandBone) {
      leftHandBone.getWorldPosition(pos);
      ikTargetsRef.current.leftHand.position.copy(pos);
    }
    const rightHandBone = rig.getBone('rightWrist') || rig.getBone('rightHand');
    if (rightHandBone) {
      rightHandBone.getWorldPosition(pos);
      ikTargetsRef.current.rightHand.position.copy(pos);
    }
    const leftFootBone = rig.getBone('leftAnkle') || rig.getBone('leftFoot');
    if (leftFootBone) {
      leftFootBone.getWorldPosition(pos);
      ikTargetsRef.current.leftFoot.position.copy(pos);
    }
    const rightFootBone = rig.getBone('rightAnkle') || rig.getBone('rightFoot');
    if (rightFootBone) {
      rightFootBone.getWorldPosition(pos);
      ikTargetsRef.current.rightFoot.position.copy(pos);
    }
  };

  // Initial and reactive character model loading
  useEffect(() => {
    const targetModelId = lighting.modelId || (lighting.gender === 'female' ? 'female' : 'male');
    const isCustom = targetModelId === 'custom' && customModelBuffer;
    const modelKey = isCustom ? 'custom' : targetModelId;

    if (currentLoadedModelRef.current !== modelKey || !rigRef.current) {
      loadCharacterModel(targetModelId, customModelBuffer);
    }
  }, [lighting.gender, lighting.modelId, customModelBuffer]);

  // Update TransformControls and Joint Highlighting when selection changes
  useEffect(() => {
    if (!transformControlsRef.current || !rigRef.current) return;

    const tc = transformControlsRef.current;
    const rig = rigRef.current;

    rig.highlightJoint(selectedJoint);

    if (controlMode === 'fk' && selectedJoint) {
      const bone = rig.getBone(selectedJoint);
      if (bone) {
        tc.setMode('rotate');
        tc.attach(bone);
      } else {
        tc.detach();
      }
    } else if (controlMode !== 'ik') {
      tc.detach();
    }
  }, [selectedJoint, controlMode]);

  // Update IK Targets Visibility
  useEffect(() => {
    if (!ikTargetsRef.current || !rigRef.current) return;
    const isIK = controlMode === 'ik';
    const targets = ikTargetsRef.current;
    targets.leftHand.visible = isIK;
    targets.rightHand.visible = isIK;
    targets.leftFoot.visible = isIK;
    targets.rightFoot.visible = isIK;

    if (isIK) {
      syncIKHandles(rigRef.current);
    } else if (transformControlsRef.current && selectedIKTargetRef.current) {
      transformControlsRef.current.detach();
      selectedIKTargetRef.current = null;
    }
  }, [controlMode]);

  // Apply External Pose
  useEffect(() => {
    if (!targetPoseToApply || !rigRef.current) return;
    applyPoseToModel(rigRef.current, targetPoseToApply);
    syncIKHandles(rigRef.current);
    onPoseApplied();
  }, [targetPoseToApply, onPoseApplied]);

  // Sync Lighting & Shading
  useEffect(() => {
    if (keyLightRef.current) {
      keyLightRef.current.intensity = lighting.keyIntensity;
      keyLightRef.current.castShadow = lighting.shadowsEnabled;

      const radius = 3.5;
      const x = radius * Math.cos(lighting.keyElevation) * Math.sin(lighting.keyAngle);
      const y = radius * Math.sin(lighting.keyElevation);
      const z = radius * Math.cos(lighting.keyElevation) * Math.cos(lighting.keyAngle);
      keyLightRef.current.position.set(x, y, z);
    }

    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = lighting.fillIntensity;
    }

    if (rimLightRef.current) {
      rimLightRef.current.intensity = lighting.rimIntensity;
    }

    if (rigRef.current) {
      rigRef.current.setShadingMode(lighting.shadingMode);
      rigRef.current.setJointHandlesVisible(lighting.jointSpheresVisible !== false);
    }

    if (controlsRef.current) {
      const active = lighting.cameraType === 'orthographic' ? orthoCameraRef.current : perspCameraRef.current;
      if (active && active !== cameraRef.current) {
        active.position.copy(cameraRef.current!.position);
        cameraRef.current = active;
        controlsRef.current.object = active;
        if (transformControlsRef.current) {
          transformControlsRef.current.camera = active;
        }
        controlsRef.current.update();
      }
    }
  }, [lighting]);

  // Handle Camera Presets
  useEffect(() => {
    if (!activePreset || !cameraRef.current) return;

    const targetCenter = new THREE.Vector3(0, 0.9, 0);
    targetControlsCenterRef.current = targetCenter;

    const dist = 3.2;

    switch (activePreset) {
      case 'front':
        targetCamPosRef.current = new THREE.Vector3(0, 0.9, dist);
        break;
      case 'back':
        targetCamPosRef.current = new THREE.Vector3(0, 0.9, -dist);
        break;
      case 'left':
        targetCamPosRef.current = new THREE.Vector3(-dist, 0.9, 0);
        break;
      case 'right':
        targetCamPosRef.current = new THREE.Vector3(dist, 0.9, 0);
        break;
      case 'top':
        targetCamPosRef.current = new THREE.Vector3(0, dist + 0.9, 0.01);
        break;
      case 'isometric':
        targetCamPosRef.current = new THREE.Vector3(2.2, 2.2, 2.2);
        break;
      case 'reset':
      default:
        targetCamPosRef.current = new THREE.Vector3(0, 1.2, 3.2);
        break;
    }

    onPresetHandled();
  }, [activePreset, onPresetHandled]);

  return (
    <div
      ref={mountRef}
      className="relative flex-1 w-full h-full overflow-hidden touch-none select-none bg-[#141518]"
    >
      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#141518]/70 backdrop-blur-sm pointer-events-none">
          <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
          <div className="text-xs font-medium text-neutral-200">Loading Human Character Rig...</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Extracting skinned mesh & bone hierarchy</div>
        </div>
      )}

      {/* Load Error Badge */}
      {loadError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3.5 py-1.5 rounded-xl text-xs backdrop-blur-md shadow-lg">
          {loadError}
        </div>
      )}
    </div>
  );
};
