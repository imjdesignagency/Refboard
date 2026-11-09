import * as THREE from 'three';
import { AnatomyLayerSettings, AnatomyStructureId, MuscleGroupId, BoneGroupId } from './anatomyTypes';

export interface AnatomyModelResult {
  root: THREE.Group;
  skeletonGroup: THREE.Group;
  muscularGroup: THREE.Group;
  skinContourGroup: THREE.Group;
  updateLayers: (settings: AnatomyLayerSettings) => void;
  highlightStructure: (id: AnatomyStructureId | null) => void;
  getStructureWorldPosition: (id: AnatomyStructureId) => THREE.Vector3 | null;
}

// Distinct anatomical atlas colors for muscle groups
const MUSCLE_ATLAS_COLORS: Record<MuscleGroupId, number> = {
  pectoralis: 0xdf4a4a,
  deltoids: 0xe06d3b,
  biceps: 0xd95368,
  triceps: 0xc44569,
  brachioradialis: 0xcd6155,
  trapezius: 0x963d3d,
  latissimus: 0xad4242,
  abdominals: 0xcc5043,
  obliques: 0xc05646,
  gluteals: 0xb33939,
  quadriceps: 0xd64545,
  hamstrings: 0xba3f4e,
  gastrocnemius: 0xc24d4d,
  sternocleidomastoid: 0x8a3333,
};

const BONE_BASE_COLOR = 0xe4ded4;
const HIGHLIGHT_COLOR = 0x3b82f6;

export function buildAnatomyFigureModel(gender: 'male' | 'female' = 'male'): AnatomyModelResult {
  const root = new THREE.Group();
  root.name = `AnatomyRoot_${gender}`;

  const isFemale = gender === 'female';

  const skeletonGroup = new THREE.Group();
  skeletonGroup.name = 'SkeletonLayer';
  root.add(skeletonGroup);

  const muscularGroup = new THREE.Group();
  muscularGroup.name = 'MuscularLayer';
  root.add(muscularGroup);

  const skinContourGroup = new THREE.Group();
  skinContourGroup.name = 'SkinContourLayer';
  root.add(skinContourGroup);

  const structureMeshes = new Map<AnatomyStructureId, THREE.Mesh[]>();
  const originalMaterials = new Map<THREE.Mesh, THREE.Material>();

  // Bone material
  const boneMat = new THREE.MeshStandardMaterial({
    color: BONE_BASE_COLOR,
    roughness: 0.55,
    metalness: 0.08,
    transparent: true,
  });

  // Selected highlight material
  const highlightMat = new THREE.MeshStandardMaterial({
    color: HIGHLIGHT_COLOR,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.65,
    roughness: 0.25,
    metalness: 0.15,
  });

  // Skin contour material
  const skinMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xd4c2b2 : 0xc9b8a8,
    roughness: 0.8,
    metalness: 0.05,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });

  const registerMesh = (mesh: THREE.Mesh, structureId: AnatomyStructureId) => {
    mesh.userData = { isAnatomy: true, structureId };
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (!structureMeshes.has(structureId)) {
      structureMeshes.set(structureId, []);
    }
    structureMeshes.get(structureId)!.push(mesh);
    originalMaterials.set(mesh, mesh.material as THREE.Material);
  };

  const createMuscleMesh = (
    geometry: THREE.BufferGeometry,
    muscleId: MuscleGroupId,
    pos: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1]
  ) => {
    const color = MUSCLE_ATLAS_COLORS[muscleId] || 0xc94a4a;
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.05,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.scale.set(...scale);
    registerMesh(mesh, muscleId);
    muscularGroup.add(mesh);
    return mesh;
  };

  const createBoneMesh = (
    geometry: THREE.BufferGeometry,
    boneId: BoneGroupId,
    pos: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1]
  ) => {
    const mesh = new THREE.Mesh(geometry, boneMat.clone());
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.scale.set(...scale);
    registerMesh(mesh, boneId);
    skeletonGroup.add(mesh);
    return mesh;
  };

  // ==========================================
  // 1. SKELETAL LAYER GEOMETRIES
  // ==========================================
  const skullCraniumGeo = new THREE.SphereGeometry(0.105, 16, 16);
  createBoneMesh(skullCraniumGeo, 'cranium', [0, 1.55, 0], [0, 0, 0], [0.88, 1.15, 1.05]);
  const zygomaticGeo = new THREE.BoxGeometry(0.12, 0.05, 0.09);
  createBoneMesh(zygomaticGeo, 'cranium', [0, 1.50, 0.04]);
  const mandibleGeo = new THREE.CylinderGeometry(0.065, 0.05, 0.08, 8);
  createBoneMesh(mandibleGeo, 'cranium', [0, 1.44, 0.03], [0, 0, 0], [1.1, 1, 0.9]);

  const cervicalGeo = new THREE.CylinderGeometry(0.032, 0.035, 0.12, 10);
  createBoneMesh(cervicalGeo, 'cervical', [0, 1.36, -0.01]);

  const ribcageGeo = new THREE.CylinderGeometry(0.15, 0.125, 0.28, 14);
  createBoneMesh(ribcageGeo, 'ribcage', [0, 1.19, -0.01], [0.08, 0, 0], [isFemale ? 1.1 : 1.25, 1, 0.85]);
  const sternumGeo = new THREE.BoxGeometry(0.035, 0.18, 0.02);
  createBoneMesh(sternumGeo, 'ribcage', [0, 1.20, 0.115], [0.08, 0, 0]);

  const clavicleGeo = new THREE.CylinderGeometry(0.016, 0.014, isFemale ? 0.20 : 0.23, 8);
  createBoneMesh(clavicleGeo, 'claviclesScapulae', [0.10, 1.32, 0.05], [0, 0, -1.45]);
  createBoneMesh(clavicleGeo, 'claviclesScapulae', [-0.10, 1.32, 0.05], [0, 0, 1.45]);
  const scapulaGeo = new THREE.BoxGeometry(0.08, 0.14, 0.02);
  createBoneMesh(scapulaGeo, 'claviclesScapulae', [0.12, 1.22, -0.11], [0, 0.2, -0.1]);
  createBoneMesh(scapulaGeo, 'claviclesScapulae', [-0.12, 1.22, -0.11], [0, -0.2, 0.1]);

  const pelvisGeo = new THREE.CylinderGeometry(0.165, 0.12, 0.16, 12);
  createBoneMesh(pelvisGeo, 'pelvis', [0, 0.96, -0.01], [-0.08, 0, 0], [isFemale ? 1.35 : 1.2, 1, 0.88]);

  const humerusGeo = new THREE.CylinderGeometry(0.025, 0.022, 0.29, 10);
  createBoneMesh(humerusGeo, 'humerus', [isFemale ? 0.21 : 0.24, 1.15, 0], [0, 0, -0.05]);
  createBoneMesh(humerusGeo, 'humerus', [isFemale ? -0.21 : -0.24, 1.15, 0], [0, 0, 0.05]);

  const radiusUlnaGeo = new THREE.CylinderGeometry(0.02, 0.017, 0.26, 10);
  createBoneMesh(radiusUlnaGeo, 'radiusUlna', [isFemale ? 0.22 : 0.25, 0.85, 0]);
  createBoneMesh(radiusUlnaGeo, 'radiusUlna', [isFemale ? -0.22 : -0.25, 0.85, 0]);

  const femurGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.43, 10);
  createBoneMesh(femurGeo, 'femur', [isFemale ? 0.13 : 0.11, 0.68, 0], [0, 0, 0.05]);
  createBoneMesh(femurGeo, 'femur', [isFemale ? -0.13 : -0.11, 0.68, 0], [0, 0, -0.05]);

  const patellaGeo = new THREE.SphereGeometry(0.03, 10, 10);
  createBoneMesh(patellaGeo, 'patellaTibiaFibula', [0.11, 0.46, 0.04]);
  createBoneMesh(patellaGeo, 'patellaTibiaFibula', [-0.11, 0.46, 0.04]);
  const tibiaGeo = new THREE.CylinderGeometry(0.032, 0.024, 0.41, 10);
  createBoneMesh(tibiaGeo, 'patellaTibiaFibula', [0.11, 0.24, 0]);
  createBoneMesh(tibiaGeo, 'patellaTibiaFibula', [-0.11, 0.24, 0]);

  const handBoneGeo = new THREE.BoxGeometry(0.035, 0.10, 0.07);
  createBoneMesh(handBoneGeo, 'extremities', [isFemale ? 0.22 : 0.25, 0.66, 0]);
  createBoneMesh(handBoneGeo, 'extremities', [isFemale ? -0.22 : -0.25, 0.66, 0]);
  const footBoneGeo = new THREE.BoxGeometry(0.07, 0.05, 0.18);
  createBoneMesh(footBoneGeo, 'extremities', [0.11, 0.025, 0.04]);
  createBoneMesh(footBoneGeo, 'extremities', [-0.11, 0.025, 0.04]);

  // ==========================================
  // 2. SUPERFICIAL MUSCULAR LAYER
  // ==========================================
  if (isFemale) {
    const bustGeo = new THREE.SphereGeometry(0.085, 14, 14);
    createMuscleMesh(bustGeo, 'pectoralis', [0.075, 1.21, 0.11], [0, 0, 0], [0.95, 1.05, 1.1]);
    createMuscleMesh(bustGeo, 'pectoralis', [-0.075, 1.21, 0.11], [0, 0, 0], [0.95, 1.05, 1.1]);
  } else {
    const pecGeo = new THREE.BoxGeometry(0.12, 0.11, 0.04);
    createMuscleMesh(pecGeo, 'pectoralis', [0.08, 1.23, 0.12], [0.05, 0.12, -0.15]);
    createMuscleMesh(pecGeo, 'pectoralis', [-0.08, 1.23, 0.12], [0.05, -0.12, 0.15]);
  }

  const deltoidGeo = new THREE.SphereGeometry(0.068, 14, 14);
  createMuscleMesh(deltoidGeo, 'deltoids', [isFemale ? 0.21 : 0.25, 1.28, 0], [0, 0, -0.2], [1.1, 1.3, 1.1]);
  createMuscleMesh(deltoidGeo, 'deltoids', [isFemale ? -0.21 : -0.25, 1.28, 0], [0, 0, 0.2], [1.1, 1.3, 1.1]);

  const bicepsGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.18, 10);
  createMuscleMesh(bicepsGeo, 'biceps', [isFemale ? 0.21 : 0.24, 1.16, 0.03], [0, 0, -0.05], [1.1, 1, 0.9]);
  createMuscleMesh(bicepsGeo, 'biceps', [isFemale ? -0.21 : -0.24, 1.16, 0.03], [0, 0, 0.05], [1.1, 1, 0.9]);

  const tricepsGeo = new THREE.CylinderGeometry(0.042, 0.035, 0.22, 10);
  createMuscleMesh(tricepsGeo, 'triceps', [isFemale ? 0.21 : 0.24, 1.15, -0.03], [0, 0, -0.05]);
  createMuscleMesh(tricepsGeo, 'triceps', [isFemale ? -0.21 : -0.24, 1.15, -0.03], [0, 0, 0.05]);

  const forearmMuscleGeo = new THREE.CylinderGeometry(0.045, 0.034, 0.24, 10);
  createMuscleMesh(forearmMuscleGeo, 'brachioradialis', [isFemale ? 0.22 : 0.25, 0.86, 0], [0, 0, 0], [1.1, 1, 0.9]);
  createMuscleMesh(forearmMuscleGeo, 'brachioradialis', [isFemale ? -0.22 : -0.25, 0.86, 0], [0, 0, 0], [1.1, 1, 0.9]);

  const trapGeo = new THREE.BoxGeometry(0.24, 0.22, 0.04);
  createMuscleMesh(trapGeo, 'trapezius', [0, 1.28, -0.10], [0.1, 0, 0]);

  const latGeo = new THREE.BoxGeometry(0.10, 0.22, 0.04);
  createMuscleMesh(latGeo, 'latissimus', [0.14, 1.12, -0.08], [0, 0.25, -0.15]);
  createMuscleMesh(latGeo, 'latissimus', [-0.14, 1.12, -0.08], [0, -0.25, 0.15]);

  const abGeo = new THREE.BoxGeometry(0.12, 0.24, 0.03);
  createMuscleMesh(abGeo, 'abdominals', [0, 1.05, 0.11], [0.05, 0, 0]);

  const obliqueGeo = new THREE.BoxGeometry(0.05, 0.18, 0.08);
  createMuscleMesh(obliqueGeo, 'obliques', [0.15, 1.04, 0.03], [0, 0, -0.1]);
  createMuscleMesh(obliqueGeo, 'obliques', [-0.15, 1.04, 0.03], [0, 0, 0.1]);

  const scmGeo = new THREE.CylinderGeometry(0.018, 0.015, 0.13, 8);
  createMuscleMesh(scmGeo, 'sternocleidomastoid', [0.04, 1.38, 0.04], [0.35, 0.15, -0.25]);
  createMuscleMesh(scmGeo, 'sternocleidomastoid', [-0.04, 1.38, 0.04], [0.35, -0.15, 0.25]);

  const gluteGeo = new THREE.SphereGeometry(isFemale ? 0.125 : 0.11, 12, 12);
  createMuscleMesh(gluteGeo, 'gluteals', [0.11, 0.94, -0.11], [0.2, 0, 0.1], [1, 1.2, 1]);
  createMuscleMesh(gluteGeo, 'gluteals', [-0.11, 0.94, -0.11], [0.2, 0, -0.1], [1, 1.2, 1]);

  const quadGeo = new THREE.CylinderGeometry(0.072, 0.052, 0.38, 12);
  createMuscleMesh(quadGeo, 'quadriceps', [0.12, 0.68, 0.03], [0, 0, 0.04], [1.1, 1, 0.95]);
  createMuscleMesh(quadGeo, 'quadriceps', [-0.12, 0.68, 0.03], [0, 0, -0.04], [1.1, 1, 0.95]);

  const hamGeo = new THREE.CylinderGeometry(0.065, 0.048, 0.36, 12);
  createMuscleMesh(hamGeo, 'hamstrings', [0.12, 0.68, -0.04], [0, 0, 0.04]);
  createMuscleMesh(hamGeo, 'hamstrings', [-0.12, 0.68, -0.04], [0, 0, -0.04]);

  const calfMuscleGeo = new THREE.CylinderGeometry(0.062, 0.038, 0.36, 12);
  createMuscleMesh(calfMuscleGeo, 'gastrocnemius', [0.11, 0.25, -0.02], [0, 0, 0], [0.95, 1, 1.15]);
  createMuscleMesh(calfMuscleGeo, 'gastrocnemius', [-0.11, 0.25, -0.02], [0, 0, 0], [0.95, 1, 1.15]);

  // ==========================================
  // 3. SKIN CONTOUR VOLUME
  // ==========================================
  const skinTorsoGeo = new THREE.CylinderGeometry(0.22, 0.19, 0.65, 14);
  const skinTorso = new THREE.Mesh(skinTorsoGeo, skinMat);
  skinTorso.position.set(0, 1.12, 0);
  skinTorso.scale.set(isFemale ? 1.15 : 1.22, 1, 0.88);
  skinContourGroup.add(skinTorso);

  const skinHeadGeo = new THREE.SphereGeometry(0.125, 16, 16);
  const skinHead = new THREE.Mesh(skinHeadGeo, skinMat);
  skinHead.position.set(0, 1.54, 0.02);
  skinHead.scale.set(0.95, 1.18, 1.08);
  skinContourGroup.add(skinHead);

  const updateLayers = (settings: AnatomyLayerSettings) => {
    boneMat.opacity = settings.skeletonOpacity;
    skeletonGroup.visible = settings.skeletonOpacity > 0.02;

    skinMat.opacity = settings.skinOpacity * 0.45;
    skinContourGroup.visible = settings.skinOpacity > 0.02;

    muscularGroup.visible = settings.muscleOpacity > 0.02;

    structureMeshes.forEach((meshes, id) => {
      const isIsolated = settings.isolatedStructureId === id;
      const isSelected = settings.selectedStructureId === id;
      const anyIsolated = settings.isolatedStructureId !== null;

      meshes.forEach((mesh) => {
        const origMat = originalMaterials.get(mesh) as THREE.MeshStandardMaterial;
        if (!origMat) return;

        if (isSelected || isIsolated) {
          mesh.material = highlightMat;
        } else if (anyIsolated) {
          const dimmedMat = origMat.clone();
          dimmedMat.opacity = 0.12;
          dimmedMat.transparent = true;
          mesh.material = dimmedMat;
        } else {
          if (settings.shadingMode === 'clay_sculpt') {
            const clayMat = origMat.clone();
            clayMat.color.setHex(isFemale ? 0xd4c7bc : 0xc7beb5);
            clayMat.opacity = settings.muscleOpacity;
            mesh.material = clayMat;
          } else if (settings.shadingMode === 'bone_focus') {
            const ghostMat = origMat.clone();
            ghostMat.opacity = settings.muscleOpacity * 0.25;
            ghostMat.wireframe = true;
            mesh.material = ghostMat;
          } else {
            origMat.opacity = settings.muscleOpacity;
            mesh.material = origMat;
          }
        }
      });
    });
  };

  const highlightStructure = (id: AnatomyStructureId | null) => {
    structureMeshes.forEach((meshes, structId) => {
      meshes.forEach((mesh) => {
        if (id && structId === id) {
          mesh.material = highlightMat;
        } else {
          mesh.material = originalMaterials.get(mesh) || boneMat;
        }
      });
    });
  };

  const getStructureWorldPosition = (id: AnatomyStructureId): THREE.Vector3 | null => {
    const meshes = structureMeshes.get(id);
    if (!meshes || meshes.length === 0) return null;
    const target = new THREE.Vector3();
    meshes[0].getWorldPosition(target);
    return target;
  };

  return {
    root,
    skeletonGroup,
    muscularGroup,
    skinContourGroup,
    updateLayers,
    highlightStructure,
    getStructureWorldPosition,
  };
}
