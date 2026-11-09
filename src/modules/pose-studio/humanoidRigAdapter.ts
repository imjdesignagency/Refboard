import * as THREE from 'three';
import { JointName, PoseTransforms, SavedPose } from './poseTypes';
import { ShadingMode } from './types';

// Canonical bone mapping dictionary supporting Mixamo, VRM/glTF humanoid, and general humanoid rigs
const BONE_NAME_PATTERNS: Record<JointName, RegExp[]> = {
  pelvis: [
    /mixamorig:?hips/i,
    /^hips$/i,
    /^pelvis$/i,
    /^root$/i,
    /b_hips/i,
  ],
  spine: [
    /mixamorig:?spine$/i,
    /^spine$/i,
    /^spine1$/i,
    /b_spine/i,
  ],
  chest: [
    /mixamorig:?spine[12]$/i,
    /^chest$/i,
    /^upperchest$/i,
    /^spine2$/i,
    /b_chest/i,
  ],
  neck: [
    /mixamorig:?neck/i,
    /^neck$/i,
    /b_neck/i,
  ],
  head: [
    /mixamorig:?head$/i,
    /^head$/i,
    /b_head/i,
  ],
  leftShoulder: [
    /mixamorig:?leftshoulder/i,
    /^left_?shoulder$/i,
    /^shoulder_?l$/i,
    /b_l_shoulder/i,
  ],
  leftUpperArm: [
    /mixamorig:?leftarm$/i,
    /^left_?upperarm$/i,
    /^left_?arm$/i,
    /^upper_?arm_?l$/i,
    /^arm_?l$/i,
    /b_l_arm/i,
  ],
  leftElbow: [
    /mixamorig:?leftforearm/i,
    /^left_?lowerarm$/i,
    /^left_?forearm$/i,
    /^forearm_?l$/i,
    /b_l_forearm/i,
  ],
  leftForearm: [
    /mixamorig:?leftforearm/i,
    /^left_?lowerarm$/i,
    /^left_?forearm$/i,
    /^forearm_?l$/i,
    /b_l_forearm/i,
  ],
  leftWrist: [
    /mixamorig:?lefthand$/i,
    /^left_?hand$/i,
    /^hand_?l$/i,
    /b_l_hand/i,
  ],
  leftHand: [
    /mixamorig:?lefthand$/i,
    /^left_?hand$/i,
    /^hand_?l$/i,
    /b_l_hand/i,
  ],
  rightShoulder: [
    /mixamorig:?rightshoulder/i,
    /^right_?shoulder$/i,
    /^shoulder_?r$/i,
    /b_r_shoulder/i,
  ],
  rightUpperArm: [
    /mixamorig:?rightarm$/i,
    /^right_?upperarm$/i,
    /^right_?arm$/i,
    /^upper_?arm_?r$/i,
    /^arm_?r$/i,
    /b_r_arm/i,
  ],
  rightElbow: [
    /mixamorig:?rightforearm/i,
    /^right_?lowerarm$/i,
    /^right_?forearm$/i,
    /^forearm_?r$/i,
    /b_r_forearm/i,
  ],
  rightForearm: [
    /mixamorig:?rightforearm/i,
    /^right_?lowerarm$/i,
    /^right_?forearm$/i,
    /^forearm_?r$/i,
    /b_r_forearm/i,
  ],
  rightWrist: [
    /mixamorig:?righthand$/i,
    /^right_?hand$/i,
    /^hand_?r$/i,
    /b_r_hand/i,
  ],
  rightHand: [
    /mixamorig:?righthand$/i,
    /^right_?hand$/i,
    /^hand_?r$/i,
    /b_r_hand/i,
  ],
  leftHip: [
    /mixamorig:?leftupleg/i,
    /^left_?upperleg$/i,
    /^left_?thigh$/i,
    /^thigh_?l$/i,
    /b_l_thigh/i,
  ],
  leftThigh: [
    /mixamorig:?leftupleg/i,
    /^left_?upperleg$/i,
    /^left_?thigh$/i,
    /^thigh_?l$/i,
    /b_l_thigh/i,
  ],
  leftKnee: [
    /mixamorig:?leftleg/i,
    /^left_?lowerleg$/i,
    /^left_?calf$/i,
    /^calf_?l$/i,
    /b_l_calf/i,
  ],
  leftCalf: [
    /mixamorig:?leftleg/i,
    /^left_?lowerleg$/i,
    /^left_?calf$/i,
    /^calf_?l$/i,
    /b_l_calf/i,
  ],
  leftAnkle: [
    /mixamorig:?leftfoot/i,
    /^left_?foot$/i,
    /^foot_?l$/i,
    /b_l_foot/i,
  ],
  leftFoot: [
    /mixamorig:?leftfoot/i,
    /^left_?foot$/i,
    /^foot_?l$/i,
    /b_l_foot/i,
  ],
  rightHip: [
    /mixamorig:?rightupleg/i,
    /^right_?upperleg$/i,
    /^right_?thigh$/i,
    /^thigh_?r$/i,
    /b_r_thigh/i,
  ],
  rightThigh: [
    /mixamorig:?rightupleg/i,
    /^right_?upperleg$/i,
    /^right_?thigh$/i,
    /^thigh_?r$/i,
    /b_r_thigh/i,
  ],
  rightKnee: [
    /mixamorig:?rightleg/i,
    /^right_?lowerleg$/i,
    /^right_?calf$/i,
    /^calf_?r$/i,
    /b_r_calf/i,
  ],
  rightCalf: [
    /mixamorig:?rightleg/i,
    /^right_?lowerleg$/i,
    /^right_?calf$/i,
    /^calf_?r$/i,
    /b_r_calf/i,
  ],
  rightAnkle: [
    /mixamorig:?rightfoot/i,
    /^right_?foot$/i,
    /^foot_?r$/i,
    /b_r_foot/i,
  ],
  rightFoot: [
    /mixamorig:?rightfoot/i,
    /^right_?foot$/i,
    /^foot_?r$/i,
    /b_r_foot/i,
  ],
  // Hand fingers & thumb controls
  leftThumb: [
    /mixamorig:?lefthandthumb[12]/i,
    /thumb.*l/i,
    /left.*thumb/i,
  ],
  leftIndex: [
    /mixamorig:?lefthandindex[12]/i,
    /index.*l/i,
    /left.*index/i,
  ],
  leftMiddle: [
    /mixamorig:?lefthandmiddle[12]/i,
    /middle.*l/i,
    /left.*middle/i,
  ],
  leftRing: [
    /mixamorig:?lefthandring[12]/i,
    /ring.*l/i,
    /left.*ring/i,
  ],
  leftPinky: [
    /mixamorig:?lefthandpinky[12]/i,
    /pinky.*l/i,
    /left.*pinky/i,
  ],
  rightThumb: [
    /mixamorig:?righthandthumb[12]/i,
    /thumb.*r/i,
    /right.*thumb/i,
  ],
  rightIndex: [
    /mixamorig:?righthandindex[12]/i,
    /index.*r/i,
    /right.*index/i,
  ],
  rightMiddle: [
    /mixamorig:?righthandmiddle[12]/i,
    /middle.*r/i,
    /right.*middle/i,
  ],
  rightRing: [
    /mixamorig:?righthandring[12]/i,
    /ring.*r/i,
    /right.*ring/i,
  ],
  rightPinky: [
    /mixamorig:?righthandpinky[12]/i,
    /pinky.*r/i,
    /right.*pinky/i,
  ],
};

let cachedMatcapTexture: THREE.CanvasTexture | null = null;

function getOrCreateMatcapTexture(): THREE.CanvasTexture {
  if (cachedMatcapTexture) return cachedMatcapTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Smooth studio ceramic matcap
  const grad = ctx.createRadialGradient(92, 78, 12, 128, 128, 126);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.2, '#f2ece4');
  grad.addColorStop(0.55, '#c9bfb4');
  grad.addColorStop(0.85, '#7d746a');
  grad.addColorStop(1, '#3a342e');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 126, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedMatcapTexture = texture;
  return texture;
}

export interface HumanoidRig {
  root: THREE.Group;
  bones: Map<JointName, THREE.Bone>;
  allBones: THREE.Bone[];
  skinnedMeshes: THREE.SkinnedMesh[];
  initialBoneRotations: Map<string, THREE.Euler>;
  initialPelvisPosition: THREE.Vector3;
  jointHandles: Map<JointName, THREE.Group>;
  areJointHandlesVisible: boolean;
  getBone(jointName: JointName): THREE.Bone | null;
  highlightJoint(jointName: JointName | null): void;
  setJointHandlesVisible(visible: boolean): void;
  setShadingMode(mode: ShadingMode): void;
  applyPose(pose: SavedPose): void;
  capturePose(name?: string): SavedPose;
  resetAllJoints(): void;
  dispose(): void;
}

export function createHumanoidRig(
  modelScene: THREE.Group,
  gender: 'male' | 'female' = 'male'
): HumanoidRig {
  const bonesMap = new Map<JointName, THREE.Bone>();
  const allBones: THREE.Bone[] = [];
  const skinnedMeshes: THREE.SkinnedMesh[] = [];
  const initialBoneRotations = new Map<string, THREE.Euler>();
  let pelvisPosition = new THREE.Vector3(0, 1.0, 0);

  // 1. Collect all bones & skinned meshes
  modelScene.traverse((child) => {
    if ((child as THREE.Bone).isBone) {
      const bone = child as THREE.Bone;
      allBones.push(bone);
      initialBoneRotations.set(bone.name, bone.rotation.clone());
    }
    if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
      const sm = child as THREE.SkinnedMesh;
      skinnedMeshes.push(sm);
      sm.castShadow = true;
      sm.receiveShadow = true;
    }
  });

  // 2. Map canonical JointNames to real character bones
  (Object.keys(BONE_NAME_PATTERNS) as JointName[]).forEach((jointName) => {
    const patterns = BONE_NAME_PATTERNS[jointName];
    for (const pattern of patterns) {
      const matched = allBones.find((b) => pattern.test(b.name));
      if (matched) {
        bonesMap.set(jointName, matched);
        break;
      }
    }
  });

  const pelvisBone = bonesMap.get('pelvis');
  if (pelvisBone) {
    pelvisPosition.copy(pelvisBone.position);
  }

  // 3. Invisible picking proxy hitboxes for limbs
  const proxyHitboxes: THREE.Mesh[] = [];
  const jointDimensions: Partial<Record<JointName, [number, number, number]>> = {
    head: [0.18, 0.22, 0.18],
    neck: [0.12, 0.14, 0.12],
    chest: [0.32, 0.28, 0.22],
    spine: [0.28, 0.22, 0.2],
    pelvis: [0.32, 0.22, 0.22],
    leftUpperArm: [0.12, 0.28, 0.12],
    rightUpperArm: [0.12, 0.28, 0.12],
    leftForearm: [0.1, 0.26, 0.1],
    rightForearm: [0.1, 0.26, 0.1],
    leftHand: [0.1, 0.14, 0.06],
    rightHand: [0.1, 0.14, 0.06],
    leftThigh: [0.18, 0.42, 0.18],
    rightThigh: [0.18, 0.42, 0.18],
    leftCalf: [0.14, 0.4, 0.14],
    rightCalf: [0.14, 0.4, 0.14],
    leftFoot: [0.12, 0.08, 0.24],
    rightFoot: [0.12, 0.08, 0.24],
  };

  const proxyMaterial = new THREE.MeshBasicMaterial({
    visible: false,
    wireframe: true,
  });

  bonesMap.forEach((bone, jointName) => {
    const dims = jointDimensions[jointName];
    const geo = dims
      ? new THREE.BoxGeometry(dims[0], dims[1], dims[2])
      : new THREE.SphereGeometry(0.045, 8, 8);
    const mesh = new THREE.Mesh(geo, proxyMaterial);
    mesh.name = `Proxy_${jointName}`;
    mesh.userData = { isJoint: true, jointName, isProxy: true };
    bone.add(mesh);
    proxyHitboxes.push(mesh);
  });

  // 4. Magic Poser-style Glowing Joint Spheres
  const jointHandles = new Map<JointName, THREE.Group>();
  const jointHandleMeshes: THREE.Mesh[] = [];

  const handleNormalMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.8,
    roughness: 0.25,
    depthTest: false,
  });

  const handleSelectedMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0.95,
    roughness: 0.15,
    depthTest: false,
  });

  const coreBeadMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    depthTest: false,
  });

  const majorArticulations: Partial<Record<JointName, number>> = {
    head: 0.05,
    neck: 0.04,
    chest: 0.055,
    spine: 0.05,
    pelvis: 0.06,
    leftShoulder: 0.045,
    rightShoulder: 0.045,
    leftElbow: 0.042,
    rightElbow: 0.042,
    leftWrist: 0.038,
    rightWrist: 0.038,
    leftHip: 0.05,
    rightHip: 0.05,
    leftKnee: 0.044,
    rightKnee: 0.044,
    leftAnkle: 0.038,
    rightAnkle: 0.038,
  };

  (Object.keys(majorArticulations) as JointName[]).forEach((jName) => {
    const bone = bonesMap.get(jName);
    if (!bone) return;

    const radius = majorArticulations[jName] || 0.04;
    const handleGroup = new THREE.Group();
    handleGroup.name = `JointHandle_${jName}`;

    // Outer glowing translucent sphere
    const sphereGeo = new THREE.SphereGeometry(radius, 16, 16);
    const sphereMesh = new THREE.Mesh(sphereGeo, handleNormalMat.clone());
    sphereMesh.renderOrder = 998;
    sphereMesh.userData = { isJoint: true, isJointHandle: true, jointName: jName };

    // Inner bright center bead
    const coreGeo = new THREE.SphereGeometry(radius * 0.35, 8, 8);
    const coreMesh = new THREE.Mesh(coreGeo, coreBeadMat);
    coreMesh.renderOrder = 999;
    coreMesh.userData = { isJoint: true, isJointHandle: true, jointName: jName };

    handleGroup.add(sphereMesh);
    handleGroup.add(coreMesh);
    bone.add(handleGroup);

    jointHandles.set(jName, handleGroup);
    jointHandleMeshes.push(sphereMesh, coreMesh);
  });

  // 5. Highlight ring indicator
  const highlightRingGeo = new THREE.TorusGeometry(0.08, 0.012, 12, 24);
  const highlightRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    depthTest: false,
  });
  const highlightRing = new THREE.Mesh(highlightRingGeo, highlightRingMat);
  highlightRing.visible = false;
  highlightRing.renderOrder = 1000;
  modelScene.add(highlightRing);

  // 6. Materials definitions for dynamic shading
  // Photorealistic Studio Skin Material
  const isFemale = gender === 'female';
  const skinMaterial = new THREE.MeshPhysicalMaterial({
    color: isFemale ? 0xe6d4c8 : 0xddcaa0,
    roughness: 0.46,
    metalness: 0.0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.55,
    ior: 1.4,
    flatShading: false,
  });

  // Sculptural Ceramic Clay Studio Material
  const clayMaterial = new THREE.MeshStandardMaterial({
    color: 0xded5cb,
    roughness: 0.58,
    metalness: 0.04,
    flatShading: false,
  });

  // Satin Smooth PBR Material
  const smoothMaterial = new THREE.MeshStandardMaterial({
    color: 0xe6ded5,
    roughness: 0.32,
    metalness: 0.06,
    flatShading: false,
  });

  const planarMaterial = new THREE.MeshStandardMaterial({
    color: 0xded5cb,
    roughness: 0.6,
    metalness: 0.04,
    flatShading: true,
  });

  const wireframeMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    wireframe: true,
    roughness: 0.4,
  });

  const matcapMaterial = new THREE.MeshMatcapMaterial({
    matcap: getOrCreateMatcapTexture(),
  });

  const applyMaterialToSkinnedMeshes = (mat: THREE.Material) => {
    skinnedMeshes.forEach((mesh) => {
      mesh.material = mat;
    });
  };

  // Default to Photorealistic Studio Skin
  applyMaterialToSkinnedMeshes(skinMaterial);

  let handlesVisible = true;

  const rig: HumanoidRig = {
    root: modelScene,
    bones: bonesMap,
    allBones,
    skinnedMeshes,
    initialBoneRotations,
    initialPelvisPosition: pelvisPosition.clone(),
    jointHandles,
    areJointHandlesVisible: handlesVisible,

    getBone(jointName: JointName): THREE.Bone | null {
      return bonesMap.get(jointName) || null;
    },

    setJointHandlesVisible(visible: boolean) {
      handlesVisible = visible;
      rig.areJointHandlesVisible = visible;
      jointHandles.forEach((group) => {
        group.visible = visible;
      });
    },

    highlightJoint(jointName: JointName | null) {
      // Reset all joint handles to normal material
      jointHandles.forEach((group, jName) => {
        const outer = group.children[0] as THREE.Mesh | undefined;
        if (outer && outer.material) {
          if (jointName === jName) {
            outer.material = handleSelectedMat;
            outer.scale.setScalar(1.2);
          } else {
            outer.material = handleNormalMat;
            outer.scale.setScalar(1.0);
          }
        }
      });

      if (!jointName) {
        highlightRing.visible = false;
        return;
      }

      const bone = bonesMap.get(jointName);
      if (bone) {
        const worldPos = new THREE.Vector3();
        bone.getWorldPosition(worldPos);
        highlightRing.position.copy(worldPos);
        highlightRing.visible = true;
      } else {
        highlightRing.visible = false;
      }
    },

    setShadingMode(mode: ShadingMode) {
      switch (mode) {
        case 'skin':
          applyMaterialToSkinnedMeshes(skinMaterial);
          break;
        case 'smooth':
          applyMaterialToSkinnedMeshes(smoothMaterial);
          break;
        case 'matcap':
          applyMaterialToSkinnedMeshes(matcapMaterial);
          break;
        case 'wireframe':
          applyMaterialToSkinnedMeshes(wireframeMaterial);
          break;
        case 'planar':
          applyMaterialToSkinnedMeshes(planarMaterial);
          break;
        case 'clay':
        default:
          applyMaterialToSkinnedMeshes(clayMaterial);
          break;
      }
    },

    applyPose(pose: SavedPose) {
      if (pose.pelvisPosition && pelvisBone) {
        pelvisBone.position.set(
          pose.pelvisPosition[0],
          pose.pelvisPosition[1],
          pose.pelvisPosition[2]
        );
      }

      Object.entries(pose.transforms).forEach(([jointKey, transform]) => {
        const jName = jointKey as JointName;
        const bone = bonesMap.get(jName);
        if (bone && transform && transform.rotation) {
          bone.rotation.set(
            transform.rotation.x,
            transform.rotation.y,
            transform.rotation.z
          );
        }
      });
    },

    capturePose(name = 'Custom Pose'): SavedPose {
      const transforms: PoseTransforms = {};
      bonesMap.forEach((bone, jName) => {
        transforms[jName] = {
          rotation: {
            x: bone.rotation.x,
            y: bone.rotation.y,
            z: bone.rotation.z,
          },
        };
      });

      return {
        id: `pose_${Date.now()}`,
        name,
        category: 'custom',
        transforms,
        pelvisPosition: pelvisBone
          ? [pelvisBone.position.x, pelvisBone.position.y, pelvisBone.position.z]
          : [0, 1, 0],
        isCustom: true,
      };
    },

    resetAllJoints() {
      allBones.forEach((bone) => {
        const initRot = initialBoneRotations.get(bone.name);
        if (initRot) {
          bone.rotation.copy(initRot);
        } else {
          bone.rotation.set(0, 0, 0);
        }
      });
      if (pelvisBone) {
        pelvisBone.position.copy(pelvisPosition);
      }
    },

    dispose() {
      highlightRingGeo.dispose();
      highlightRingMat.dispose();
      skinMaterial.dispose();
      clayMaterial.dispose();
      smoothMaterial.dispose();
      planarMaterial.dispose();
      wireframeMaterial.dispose();
      matcapMaterial.dispose();
      handleNormalMat.dispose();
      handleSelectedMat.dispose();
      coreBeadMat.dispose();
      proxyHitboxes.forEach((p) => {
        p.geometry.dispose();
      });
      jointHandleMeshes.forEach((m) => {
        m.geometry.dispose();
      });
    },
  };

  return rig;
}
