import * as THREE from 'three';
import { BodyGender, ShadingMode } from './types';
import { JointName } from './poseTypes';

export interface RigJoints {
  pelvis: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  leftShoulder: THREE.Group;
  leftUpperArm: THREE.Group;
  leftElbow: THREE.Group;
  leftForearm: THREE.Group;
  leftWrist: THREE.Group;
  leftHand: THREE.Group;
  rightShoulder: THREE.Group;
  rightUpperArm: THREE.Group;
  rightElbow: THREE.Group;
  rightForearm: THREE.Group;
  rightWrist: THREE.Group;
  rightHand: THREE.Group;
  leftHip: THREE.Group;
  leftThigh: THREE.Group;
  leftKnee: THREE.Group;
  leftCalf: THREE.Group;
  leftAnkle: THREE.Group;
  leftFoot: THREE.Group;
  rightHip: THREE.Group;
  rightThigh: THREE.Group;
  rightKnee: THREE.Group;
  rightCalf: THREE.Group;
  rightAnkle: THREE.Group;
  rightFoot: THREE.Group;
}

export interface HumanModelResult {
  root: THREE.Group;
  joints: RigJoints;
  materials: THREE.Material[];
  setShadingMode: (mode: ShadingMode) => void;
  highlightJoint: (jointName: JointName | null) => void;
}

/**
 * Creates smooth organic lathe profiles for anatomical limb and body contours
 */
function createAnatomicalLathe(points: [number, number][], segments = 18): THREE.LatheGeometry {
  const vecPoints = points.map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(vecPoints, segments);
}

export function buildArticulatedHumanModel(gender: BodyGender = 'male'): HumanModelResult {
  const root = new THREE.Group();
  root.name = `HumanModelRoot_${gender}`;

  const isFemale = gender === 'female';
  const materials: THREE.MeshStandardMaterial[] = [];

  // Heroic Clay Studio Material (PoseMy.Art Style)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xe5dad0 : 0xded5cb,
    roughness: isFemale ? 0.52 : 0.58,
    metalness: 0.04,
    flatShading: false,
  });
  materials.push(bodyMat);

  // Joint Articulation Landmark Material
  const jointMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xc8b8ab : 0xbfae9e,
    roughness: 0.45,
    metalness: 0.08,
    flatShading: false,
  });
  materials.push(jointMat);

  // Highlight Material for Selected Joint
  const selectedJointMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.65,
    roughness: 0.2,
    metalness: 0.1,
  });

  // Facial / Feature Accent Material
  const accentMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xbba79a : 0xa8998b,
    roughness: 0.5,
    metalness: 0.1,
  });
  materials.push(accentMat);

  const jointMeshes = new Map<JointName, THREE.Mesh[]>();

  const registerMesh = (mesh: THREE.Mesh, jointName: JointName) => {
    mesh.userData = { isJoint: true, jointName };
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (!jointMeshes.has(jointName)) {
      jointMeshes.set(jointName, []);
    }
    jointMeshes.get(jointName)!.push(mesh);
  };

  const createJointSphere = (radius: number, jointName: JointName) => {
    const geo = new THREE.SphereGeometry(radius, 16, 16);
    const mesh = new THREE.Mesh(geo, jointMat);
    registerMesh(mesh, jointName);
    return mesh;
  };

  // --- SKELETAL JOINT HIERARCHY & HEROIC ORGANIC MANNEQUIN GEOMETRIES ---
  // 1. Pelvis / Hips
  const pelvis = new THREE.Group();
  pelvis.name = 'Pelvis';
  pelvis.userData = { isJointGroup: true, jointName: 'pelvis' };
  pelvis.position.set(0, 1.0, 0);
  root.add(pelvis);

  const pelvisProfile: [number, number][] = isFemale
    ? [
        [0.08, -0.12],
        [0.15, -0.06],
        [0.18, 0.0],
        [0.16, 0.06],
        [0.11, 0.10],
      ]
    : [
        [0.09, -0.12],
        [0.145, -0.05],
        [0.165, 0.0],
        [0.155, 0.06],
        [0.125, 0.09],
      ];

  const pelvisGeo = createAnatomicalLathe(pelvisProfile, 20);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, bodyMat);
  pelvisMesh.scale.set(isFemale ? 1.25 : 1.18, 1, isFemale ? 0.95 : 0.88);
  registerMesh(pelvisMesh, 'pelvis');
  pelvis.add(pelvisMesh);

  // Gluteal muscle volume
  const gluteGeo = new THREE.SphereGeometry(isFemale ? 0.115 : 0.105, 16, 16);
  const leftGlute = new THREE.Mesh(gluteGeo, bodyMat);
  leftGlute.position.set(0.08, -0.02, -0.075);
  leftGlute.scale.set(0.9, 1.15, 1.1);
  registerMesh(leftGlute, 'pelvis');
  pelvis.add(leftGlute);

  const rightGlute = new THREE.Mesh(gluteGeo, bodyMat);
  rightGlute.position.set(-0.08, -0.02, -0.075);
  rightGlute.scale.set(0.9, 1.15, 1.1);
  registerMesh(rightGlute, 'pelvis');
  pelvis.add(rightGlute);

  // 2. Spine / Waist Taper
  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.userData = { isJointGroup: true, jointName: 'spine' };
  spine.position.set(0, 0.1, 0);
  pelvis.add(spine);

  spine.add(createJointSphere(0.075, 'spine'));

  const waistProfile: [number, number][] = isFemale
    ? [
        [0.11, 0.0],
        [0.10, 0.06],
        [0.11, 0.12],
        [0.13, 0.18],
      ]
    : [
        [0.125, 0.0],
        [0.13, 0.06],
        [0.14, 0.12],
        [0.16, 0.18],
      ];
  const spineGeo = createAnatomicalLathe(waistProfile, 18);
  const spineMesh = new THREE.Mesh(spineGeo, bodyMat);
  spineMesh.scale.set(1.0, 1, 0.84);
  registerMesh(spineMesh, 'spine');
  spine.add(spineMesh);

  // Male 8-Pack Rectus Abdominis muscle contour segments
  if (!isFemale) {
    for (let r = 0; r < 4; r++) {
      const abGeo = new THREE.BoxGeometry(0.125, 0.038, 0.025);
      const abMesh = new THREE.Mesh(abGeo, bodyMat);
      abMesh.position.set(0, 0.02 + r * 0.042, 0.085);
      registerMesh(abMesh, 'spine');
      spine.add(abMesh);
    }
  }

  // 3. Chest / Heroic Thorax
  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.userData = { isJointGroup: true, jointName: 'chest' };
  chest.position.set(0, 0.18, 0);
  spine.add(chest);

  chest.add(createJointSphere(0.085, 'chest'));

  const chestProfile: [number, number][] = isFemale
    ? [
        [0.13, 0.0],
        [0.165, 0.1],
        [0.175, 0.18],
        [0.155, 0.24],
      ]
    : [
        [0.16, 0.0],
        [0.195, 0.1],
        [0.21, 0.18],
        [0.18, 0.25],
      ];
  const chestGeo = createAnatomicalLathe(chestProfile, 20);
  const chestMesh = new THREE.Mesh(chestGeo, bodyMat);
  chestMesh.scale.set(isFemale ? 1.15 : 1.28, 1, 0.85);
  registerMesh(chestMesh, 'chest');
  chest.add(chestMesh);

  // Female Bust Contours vs Male Pectoral Muscle Plates
  if (isFemale) {
    const bustGeo = new THREE.SphereGeometry(0.088, 18, 18);
    const leftBust = new THREE.Mesh(bustGeo, bodyMat);
    leftBust.position.set(0.078, 0.11, 0.115);
    leftBust.scale.set(0.95, 1.05, 1.12);
    registerMesh(leftBust, 'chest');
    chest.add(leftBust);

    const rightBust = new THREE.Mesh(bustGeo, bodyMat);
    rightBust.position.set(-0.078, 0.11, 0.115);
    rightBust.scale.set(0.95, 1.05, 1.12);
    registerMesh(rightBust, 'chest');
    chest.add(rightBust);
  } else {
    // Sculpted Heroic Pectoral Plates
    const pecGeo = new THREE.BoxGeometry(0.135, 0.12, 0.045);
    const leftPec = new THREE.Mesh(pecGeo, bodyMat);
    leftPec.position.set(0.08, 0.14, 0.11);
    leftPec.rotation.set(0.06, 0.12, -0.15);
    registerMesh(leftPec, 'chest');
    chest.add(leftPec);

    const rightPec = new THREE.Mesh(pecGeo, bodyMat);
    rightPec.position.set(-0.08, 0.14, 0.11);
    rightPec.rotation.set(0.06, -0.12, 0.15);
    registerMesh(rightPec, 'chest');
    chest.add(rightPec);

    // Serratus Anterior Rib Serrations
    for (let s = 0; s < 3; s++) {
      const serratusGeo = new THREE.BoxGeometry(0.04, 0.02, 0.03);
      const leftSerratus = new THREE.Mesh(serratusGeo, bodyMat);
      leftSerratus.position.set(0.15, 0.05 + s * 0.035, 0.06 - s * 0.01);
      leftSerratus.rotation.set(0, 0.3, -0.2);
      registerMesh(leftSerratus, 'chest');
      chest.add(leftSerratus);

      const rightSerratus = new THREE.Mesh(serratusGeo, bodyMat);
      rightSerratus.position.set(-0.15, 0.05 + s * 0.035, 0.06 - s * 0.01);
      rightSerratus.rotation.set(0, -0.3, 0.2);
      registerMesh(rightSerratus, 'chest');
      chest.add(rightSerratus);
    }
  }

  // Latissimus Dorsi V-Taper Wings
  const latGeo = new THREE.BoxGeometry(0.09, 0.22, 0.045);
  const leftLat = new THREE.Mesh(latGeo, bodyMat);
  leftLat.position.set(0.15, 0.12, -0.065);
  leftLat.rotation.set(0, 0.25, -0.16);
  registerMesh(leftLat, 'chest');
  chest.add(leftLat);

  const rightLat = new THREE.Mesh(latGeo, bodyMat);
  rightLat.position.set(-0.15, 0.12, -0.065);
  rightLat.rotation.set(0, -0.25, 0.16);
  registerMesh(rightLat, 'chest');
  chest.add(rightLat);

  // 4. Neck & Sternocleidomastoid
  const neck = new THREE.Group();
  neck.name = 'Neck';
  neck.userData = { isJointGroup: true, jointName: 'neck' };
  neck.position.set(0, 0.25, 0);
  chest.add(neck);

  const neckProfile: [number, number][] = [
    [0.07, 0.0],
    [0.064, 0.05],
    [0.06, 0.10],
  ];
  const neckGeo = createAnatomicalLathe(neckProfile, 16);
  const neckMesh = new THREE.Mesh(neckGeo, bodyMat);
  registerMesh(neckMesh, 'neck');
  neck.add(neckMesh);

  // SCM Muscle V-Struts
  const scmGeo = new THREE.CylinderGeometry(0.016, 0.013, 0.10, 8);
  const leftScm = new THREE.Mesh(scmGeo, bodyMat);
  leftScm.position.set(0.032, 0.05, 0.032);
  leftScm.rotation.set(0.35, 0.15, -0.25);
  registerMesh(leftScm, 'neck');
  neck.add(leftScm);

  const rightScm = new THREE.Mesh(scmGeo, bodyMat);
  rightScm.position.set(-0.032, 0.05, 0.032);
  rightScm.rotation.set(0.35, -0.15, 0.25);
  registerMesh(rightScm, 'neck');
  neck.add(rightScm);

  // 5. Head with Facial Structure (Nose, Jaw, Brow, Chin)
  const head = new THREE.Group();
  head.name = 'Head';
  head.userData = { isJointGroup: true, jointName: 'head' };
  head.position.set(0, 0.10, 0.02);
  neck.add(head);

  // Cranial Vault
  const craniumGeo = new THREE.SphereGeometry(0.108, 18, 18);
  const craniumMesh = new THREE.Mesh(craniumGeo, bodyMat);
  craniumMesh.position.set(0, 0.08, 0);
  craniumMesh.scale.set(0.88, 1.15, 1.05);
  registerMesh(craniumMesh, 'head');
  head.add(craniumMesh);

  // Tapered Jawline & Chin
  const jawGeo = new THREE.CylinderGeometry(0.062, 0.044, 0.10, 12);
  const jawMesh = new THREE.Mesh(jawGeo, bodyMat);
  jawMesh.position.set(0, 0.01, 0.032);
  jawMesh.rotation.set(0.2, 0, 0);
  registerMesh(jawMesh, 'head');
  head.add(jawMesh);

  // Nose Bridge Wedge
  const noseGeo = new THREE.ConeGeometry(0.019, 0.048, 4);
  const noseMesh = new THREE.Mesh(noseGeo, accentMat);
  noseMesh.position.set(0, 0.062, 0.108);
  noseMesh.rotation.set(-0.2, 0, 0);
  registerMesh(noseMesh, 'head');
  head.add(noseMesh);

  // Lips
  const lipGeo = new THREE.BoxGeometry(0.04, 0.012, 0.012);
  const lipMesh = new THREE.Mesh(lipGeo, accentMat);
  lipMesh.position.set(0, 0.02, 0.089);
  registerMesh(lipMesh, 'head');
  head.add(lipMesh);

  // --- LEFT UPPER LIMB ---
  const leftShoulder = new THREE.Group();
  leftShoulder.name = 'LeftShoulder';
  leftShoulder.userData = { isJointGroup: true, jointName: 'leftShoulder' };
  leftShoulder.position.set(isFemale ? 0.21 : 0.25, 0.21, 0);
  chest.add(leftShoulder);

  // Deltoid Teardrop Cap
  const deltoidGeo = new THREE.SphereGeometry(0.068, 16, 16);
  const leftDeltoid = new THREE.Mesh(deltoidGeo, bodyMat);
  leftDeltoid.scale.set(1.05, 1.38, 1.12);
  leftDeltoid.position.set(0, -0.04, 0);
  registerMesh(leftDeltoid, 'leftShoulder');
  leftShoulder.add(leftDeltoid);

  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'LeftUpperArm';
  leftUpperArm.userData = { isJointGroup: true, jointName: 'leftUpperArm' };
  leftShoulder.add(leftUpperArm);

  const upperArmProfile: [number, number][] = [
    [0.058, 0.0],
    [0.054, -0.08],
    [0.049, -0.18],
    [0.044, -0.28],
  ];
  const upperArmGeo = createAnatomicalLathe(upperArmProfile, 16);
  const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, bodyMat);
  registerMesh(leftUpperArmMesh, 'leftUpperArm');
  leftUpperArm.add(leftUpperArmMesh);

  // Biceps muscle belly
  const bicepsGeo = new THREE.CylinderGeometry(0.04, 0.034, 0.17, 12);
  const leftBiceps = new THREE.Mesh(bicepsGeo, bodyMat);
  leftBiceps.position.set(0, -0.14, 0.022);
  registerMesh(leftBiceps, 'leftUpperArm');
  leftUpperArm.add(leftBiceps);

  // Triceps horseshoe
  const tricepsGeo = new THREE.CylinderGeometry(0.042, 0.035, 0.18, 12);
  const leftTriceps = new THREE.Mesh(tricepsGeo, bodyMat);
  leftTriceps.position.set(0, -0.14, -0.022);
  registerMesh(leftTriceps, 'leftUpperArm');
  leftUpperArm.add(leftTriceps);

  const leftElbow = new THREE.Group();
  leftElbow.name = 'LeftElbow';
  leftElbow.userData = { isJointGroup: true, jointName: 'leftElbow' };
  leftElbow.position.set(0, -0.30, 0);
  leftUpperArm.add(leftElbow);
  leftElbow.add(createJointSphere(0.048, 'leftElbow'));

  const leftForearm = new THREE.Group();
  leftForearm.name = 'LeftForearm';
  leftForearm.userData = { isJointGroup: true, jointName: 'leftForearm' };
  leftElbow.add(leftForearm);

  const forearmProfile: [number, number][] = [
    [0.049, 0.0],
    [0.047, -0.06],
    [0.039, -0.16],
    [0.032, -0.26],
  ];
  const forearmGeo = createAnatomicalLathe(forearmProfile, 16);
  const leftForearmMesh = new THREE.Mesh(forearmGeo, bodyMat);
  registerMesh(leftForearmMesh, 'leftForearm');
  leftForearm.add(leftForearmMesh);

  // Brachioradialis muscle flare
  const brachioGeo = new THREE.CylinderGeometry(0.036, 0.026, 0.14, 10);
  const leftBrachio = new THREE.Mesh(brachioGeo, bodyMat);
  leftBrachio.position.set(0.016, -0.08, 0.01);
  leftBrachio.rotation.set(0, 0, -0.1);
  registerMesh(leftBrachio, 'leftForearm');
  leftForearm.add(leftBrachio);

  const leftWrist = new THREE.Group();
  leftWrist.name = 'LeftWrist';
  leftWrist.userData = { isJointGroup: true, jointName: 'leftWrist' };
  leftWrist.position.set(0, -0.28, 0);
  leftForearm.add(leftWrist);
  leftWrist.add(createJointSphere(0.036, 'leftWrist'));

  const leftHand = new THREE.Group();
  leftHand.name = 'LeftHand';
  leftHand.userData = { isJointGroup: true, jointName: 'leftHand' };
  leftWrist.add(leftHand);

  // Palm base
  const palmGeo = new THREE.BoxGeometry(0.042, 0.09, 0.075);
  const leftPalm = new THREE.Mesh(palmGeo, bodyMat);
  leftPalm.position.set(0, -0.05, 0);
  registerMesh(leftPalm, 'leftHand');
  leftHand.add(leftPalm);

  // Articulated fingers
  const fingerGeo = new THREE.CylinderGeometry(0.007, 0.005, 0.06, 8);
  for (let f = 0; f < 4; f++) {
    const finger = new THREE.Mesh(fingerGeo, bodyMat);
    finger.position.set(0, -0.11, -0.025 + f * 0.018);
    registerMesh(finger, 'leftHand');
    leftHand.add(finger);
  }
  const thumbGeo = new THREE.CylinderGeometry(0.008, 0.006, 0.05, 8);
  const leftThumb = new THREE.Mesh(thumbGeo, bodyMat);
  leftThumb.position.set(0.02, -0.05, 0.03);
  leftThumb.rotation.set(0.3, 0, -0.5);
  registerMesh(leftThumb, 'leftHand');
  leftHand.add(leftThumb);

  // --- RIGHT UPPER LIMB ---
  const rightShoulder = new THREE.Group();
  rightShoulder.name = 'RightShoulder';
  rightShoulder.userData = { isJointGroup: true, jointName: 'rightShoulder' };
  rightShoulder.position.set(isFemale ? -0.21 : -0.25, 0.21, 0);
  chest.add(rightShoulder);

  const rightDeltoid = new THREE.Mesh(deltoidGeo, bodyMat);
  rightDeltoid.scale.set(1.05, 1.38, 1.12);
  rightDeltoid.position.set(0, -0.04, 0);
  registerMesh(rightDeltoid, 'rightShoulder');
  rightShoulder.add(rightDeltoid);

  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'RightUpperArm';
  rightUpperArm.userData = { isJointGroup: true, jointName: 'rightUpperArm' };
  rightShoulder.add(rightUpperArm);

  const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, bodyMat);
  registerMesh(rightUpperArmMesh, 'rightUpperArm');
  rightUpperArm.add(rightUpperArmMesh);

  const rightBiceps = new THREE.Mesh(bicepsGeo, bodyMat);
  rightBiceps.position.set(0, -0.14, 0.022);
  registerMesh(rightBiceps, 'rightUpperArm');
  rightUpperArm.add(rightBiceps);

  const rightTriceps = new THREE.Mesh(tricepsGeo, bodyMat);
  rightTriceps.position.set(0, -0.14, -0.022);
  registerMesh(rightTriceps, 'rightUpperArm');
  rightUpperArm.add(rightTriceps);

  const rightElbow = new THREE.Group();
  rightElbow.name = 'RightElbow';
  rightElbow.userData = { isJointGroup: true, jointName: 'rightElbow' };
  rightElbow.position.set(0, -0.30, 0);
  rightUpperArm.add(rightElbow);
  rightElbow.add(createJointSphere(0.048, 'rightElbow'));

  const rightForearm = new THREE.Group();
  rightForearm.name = 'RightForearm';
  rightForearm.userData = { isJointGroup: true, jointName: 'rightForearm' };
  rightElbow.add(rightForearm);

  const rightForearmMesh = new THREE.Mesh(forearmGeo, bodyMat);
  registerMesh(rightForearmMesh, 'rightForearm');
  rightForearm.add(rightForearmMesh);

  const rightBrachio = new THREE.Mesh(brachioGeo, bodyMat);
  rightBrachio.position.set(-0.016, -0.08, 0.01);
  rightBrachio.rotation.set(0, 0, 0.1);
  registerMesh(rightBrachio, 'rightForearm');
  rightForearm.add(rightBrachio);

  const rightWrist = new THREE.Group();
  rightWrist.name = 'RightWrist';
  rightWrist.userData = { isJointGroup: true, jointName: 'rightWrist' };
  rightWrist.position.set(0, -0.28, 0);
  rightForearm.add(rightWrist);
  rightWrist.add(createJointSphere(0.036, 'rightWrist'));

  const rightHand = new THREE.Group();
  rightHand.name = 'RightHand';
  rightHand.userData = { isJointGroup: true, jointName: 'rightHand' };
  rightWrist.add(rightHand);

  const rightPalm = new THREE.Mesh(palmGeo, bodyMat);
  rightPalm.position.set(0, -0.05, 0);
  registerMesh(rightPalm, 'rightHand');
  rightHand.add(rightPalm);

  for (let f = 0; f < 4; f++) {
    const finger = new THREE.Mesh(fingerGeo, bodyMat);
    finger.position.set(0, -0.11, -0.025 + f * 0.018);
    registerMesh(finger, 'rightHand');
    rightHand.add(finger);
  }
  const rightThumb = new THREE.Mesh(thumbGeo, bodyMat);
  rightThumb.position.set(-0.02, -0.05, 0.03);
  rightThumb.rotation.set(0.3, 0, 0.5);
  registerMesh(rightThumb, 'rightHand');
  rightHand.add(rightThumb);

  // --- LEFT LOWER LIMB ---
  const leftHip = new THREE.Group();
  leftHip.name = 'LeftHip';
  leftHip.userData = { isJointGroup: true, jointName: 'leftHip' };
  leftHip.position.set(isFemale ? 0.13 : 0.115, -0.08, 0);
  pelvis.add(leftHip);
  leftHip.add(createJointSphere(0.075, 'leftHip'));

  const leftThigh = new THREE.Group();
  leftThigh.name = 'LeftThigh';
  leftThigh.userData = { isJointGroup: true, jointName: 'leftThigh' };
  leftHip.add(leftThigh);

  const thighProfile: [number, number][] = [
    [0.082, 0.0],
    [0.078, -0.12],
    [0.065, -0.26],
    [0.055, -0.42],
  ];
  const thighGeo = createAnatomicalLathe(thighProfile, 18);
  const leftThighMesh = new THREE.Mesh(thighGeo, bodyMat);
  registerMesh(leftThighMesh, 'leftThigh');
  leftThigh.add(leftThighMesh);

  // Quadriceps group with vastus medialis teardrop
  const quadGeo = new THREE.CylinderGeometry(0.072, 0.052, 0.28, 14);
  const leftQuad = new THREE.Mesh(quadGeo, bodyMat);
  leftQuad.position.set(0, -0.22, 0.022);
  registerMesh(leftQuad, 'leftThigh');
  leftThigh.add(leftQuad);

  const leftKnee = new THREE.Group();
  leftKnee.name = 'LeftKnee';
  leftKnee.userData = { isJointGroup: true, jointName: 'leftKnee' };
  leftKnee.position.set(0, -0.44, 0);
  leftThigh.add(leftKnee);
  leftKnee.add(createJointSphere(0.06, 'leftKnee'));

  // Patella knee cap
  const patellaGeo = new THREE.SphereGeometry(0.03, 12, 12);
  const leftPatella = new THREE.Mesh(patellaGeo, bodyMat);
  leftPatella.position.set(0, 0, 0.045);
  registerMesh(leftPatella, 'leftKnee');
  leftKnee.add(leftPatella);

  const leftCalf = new THREE.Group();
  leftCalf.name = 'LeftCalf';
  leftCalf.userData = { isJointGroup: true, jointName: 'leftCalf' };
  leftKnee.add(leftCalf);

  const calfProfile: [number, number][] = [
    [0.06, 0.0],
    [0.065, -0.10],
    [0.05, -0.26],
    [0.038, -0.40],
  ];
  const calfGeo = createAnatomicalLathe(calfProfile, 18);
  const leftCalfMesh = new THREE.Mesh(calfGeo, bodyMat);
  registerMesh(leftCalfMesh, 'leftCalf');
  leftCalf.add(leftCalfMesh);

  // Gastrocnemius double-head calf muscles
  const gastroGeo = new THREE.CylinderGeometry(0.058, 0.038, 0.22, 12);
  const leftGastro = new THREE.Mesh(gastroGeo, bodyMat);
  leftGastro.position.set(0, -0.12, -0.022);
  registerMesh(leftGastro, 'leftCalf');
  leftCalf.add(leftGastro);

  const leftAnkle = new THREE.Group();
  leftAnkle.name = 'LeftAnkle';
  leftAnkle.userData = { isJointGroup: true, jointName: 'leftAnkle' };
  leftAnkle.position.set(0, -0.42, 0);
  leftCalf.add(leftAnkle);
  leftAnkle.add(createJointSphere(0.044, 'leftAnkle'));

  const leftFoot = new THREE.Group();
  leftFoot.name = 'LeftFoot';
  leftFoot.userData = { isJointGroup: true, jointName: 'leftFoot' };
  leftAnkle.add(leftFoot);

  const footGeo = new THREE.BoxGeometry(0.078, 0.058, 0.195);
  const leftFootMesh = new THREE.Mesh(footGeo, bodyMat);
  leftFootMesh.position.set(0, -0.03, 0.05);
  registerMesh(leftFootMesh, 'leftFoot');
  leftFoot.add(leftFootMesh);

  // --- RIGHT LOWER LIMB ---
  const rightHip = new THREE.Group();
  rightHip.name = 'RightHip';
  rightHip.userData = { isJointGroup: true, jointName: 'rightHip' };
  rightHip.position.set(isFemale ? -0.13 : -0.115, -0.08, 0);
  pelvis.add(rightHip);
  rightHip.add(createJointSphere(0.075, 'rightHip'));

  const rightThigh = new THREE.Group();
  rightThigh.name = 'RightThigh';
  rightThigh.userData = { isJointGroup: true, jointName: 'rightThigh' };
  rightHip.add(rightThigh);

  const rightThighMesh = new THREE.Mesh(thighGeo, bodyMat);
  registerMesh(rightThighMesh, 'rightThigh');
  rightThigh.add(rightThighMesh);

  const rightQuad = new THREE.Mesh(quadGeo, bodyMat);
  rightQuad.position.set(0, -0.22, 0.022);
  registerMesh(rightQuad, 'rightThigh');
  rightThigh.add(rightQuad);

  const rightKnee = new THREE.Group();
  rightKnee.name = 'RightKnee';
  rightKnee.userData = { isJointGroup: true, jointName: 'rightKnee' };
  rightKnee.position.set(0, -0.44, 0);
  rightThigh.add(rightKnee);
  rightKnee.add(createJointSphere(0.06, 'rightKnee'));

  const rightPatella = new THREE.Mesh(patellaGeo, bodyMat);
  rightPatella.position.set(0, 0, 0.045);
  registerMesh(rightPatella, 'rightKnee');
  rightKnee.add(rightPatella);

  const rightCalf = new THREE.Group();
  rightCalf.name = 'RightCalf';
  rightCalf.userData = { isJointGroup: true, jointName: 'rightCalf' };
  rightKnee.add(rightCalf);

  const rightCalfMesh = new THREE.Mesh(calfGeo, bodyMat);
  registerMesh(rightCalfMesh, 'rightCalf');
  rightCalf.add(rightCalfMesh);

  const rightGastro = new THREE.Mesh(gastroGeo, bodyMat);
  rightGastro.position.set(0, -0.12, -0.022);
  registerMesh(rightGastro, 'rightCalf');
  rightCalf.add(rightGastro);

  const rightAnkle = new THREE.Group();
  rightAnkle.name = 'RightAnkle';
  rightAnkle.userData = { isJointGroup: true, jointName: 'rightAnkle' };
  rightAnkle.position.set(0, -0.42, 0);
  rightCalf.add(rightAnkle);
  rightAnkle.add(createJointSphere(0.044, 'rightAnkle'));

  const rightFoot = new THREE.Group();
  rightFoot.name = 'RightFoot';
  rightFoot.userData = { isJointGroup: true, jointName: 'rightFoot' };
  rightAnkle.add(rightFoot);

  const rightFootMesh = new THREE.Mesh(footGeo, bodyMat);
  rightFootMesh.position.set(0, -0.03, 0.05);
  registerMesh(rightFootMesh, 'rightFoot');
  rightFoot.add(rightFootMesh);

  const joints: RigJoints = {
    pelvis,
    spine,
    chest,
    neck,
    head,
    leftShoulder,
    leftUpperArm,
    leftElbow,
    leftForearm,
    leftWrist,
    leftHand,
    rightShoulder,
    rightUpperArm,
    rightElbow,
    rightForearm,
    rightWrist,
    rightHand,
    leftHip,
    leftThigh,
    leftKnee,
    leftCalf,
    leftAnkle,
    leftFoot,
    rightHip,
    rightThigh,
    rightKnee,
    rightCalf,
    rightAnkle,
    rightFoot,
  };

  let currentlyHighlighted: JointName | null = null;

  const highlightJoint = (jointName: JointName | null) => {
    if (currentlyHighlighted && jointMeshes.has(currentlyHighlighted)) {
      jointMeshes.get(currentlyHighlighted)!.forEach((mesh) => {
        mesh.material = (mesh.geometry instanceof THREE.SphereGeometry) ? jointMat : bodyMat;
      });
    }

    currentlyHighlighted = jointName;

    if (jointName && jointMeshes.has(jointName)) {
      jointMeshes.get(jointName)!.forEach((mesh) => {
        mesh.material = selectedJointMat;
      });
    }
  };

  const setShadingMode = (mode: ShadingMode) => {
    materials.forEach((mat) => {
      if (mode === 'wireframe') {
        mat.wireframe = true;
        mat.flatShading = false;
      } else if (mode === 'planar') {
        mat.wireframe = false;
        mat.flatShading = true;
      } else {
        mat.wireframe = false;
        mat.flatShading = false;
      }
      mat.needsUpdate = true;
    });
  };

  return { root, joints, materials, setShadingMode, highlightJoint };
}
