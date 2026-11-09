import * as THREE from 'three';
import { SavedPose, JointName, PoseTransforms } from './poseTypes';
import { RigJoints } from './humanRigBuilder';
import { HumanoidRig } from './humanoidRigAdapter';

const deg = (degrees: number) => (degrees * Math.PI) / 180;

export const BUILTIN_POSES: SavedPose[] = [
  {
    id: 'natural-a',
    name: 'Relaxed Standing (A-Pose)',
    category: 'neutral',
    description: 'Natural resting stance with relaxed shoulders, anatomical arm angle, and gently curved fingers.',
    transforms: {
      leftUpperArm: { rotation: { x: deg(6), y: deg(0), z: deg(-48) } },
      rightUpperArm: { rotation: { x: deg(6), y: deg(0), z: deg(48) } },
      leftElbow: { rotation: { x: deg(16), y: deg(0), z: deg(0) } },
      rightElbow: { rotation: { x: deg(16), y: deg(0), z: deg(0) } },
      leftWrist: { rotation: { x: deg(4), y: deg(0), z: deg(-6) } },
      rightWrist: { rotation: { x: deg(4), y: deg(0), z: deg(6) } },
      leftThigh: { rotation: { x: deg(0), y: deg(0), z: deg(2.5) } },
      rightThigh: { rotation: { x: deg(0), y: deg(0), z: deg(-2.5) } },
      leftKnee: { rotation: { x: deg(0), y: deg(0), z: deg(0) } },
      rightKnee: { rotation: { x: deg(0), y: deg(0), z: deg(0) } },
      head: { rotation: { x: deg(-2), y: deg(0), z: deg(0) } },
      spine: { rotation: { x: deg(2), y: deg(0), z: deg(0) } },
      chest: { rotation: { x: deg(2), y: deg(0), z: deg(0) } },
      // Naturally curved fingers
      leftThumb: { rotation: { x: deg(10), y: deg(0), z: deg(0) } },
      leftIndex: { rotation: { x: deg(14), y: deg(0), z: deg(0) } },
      leftMiddle: { rotation: { x: deg(16), y: deg(0), z: deg(0) } },
      leftRing: { rotation: { x: deg(16), y: deg(0), z: deg(0) } },
      leftPinky: { rotation: { x: deg(18), y: deg(0), z: deg(0) } },
      rightThumb: { rotation: { x: deg(10), y: deg(0), z: deg(0) } },
      rightIndex: { rotation: { x: deg(14), y: deg(0), z: deg(0) } },
      rightMiddle: { rotation: { x: deg(16), y: deg(0), z: deg(0) } },
      rightRing: { rotation: { x: deg(16), y: deg(0), z: deg(0) } },
      rightPinky: { rotation: { x: deg(18), y: deg(0), z: deg(0) } },
    },
    pelvisPosition: [0, 0.98, 0],
  },
  {
    id: 'neutral-t',
    name: 'Anatomical T-Pose',
    category: 'neutral',
    description: 'Orthogonal reference standard with horizontal arms and aligned vertical axis.',
    transforms: {
      leftUpperArm: { rotation: { x: 0, y: 0, z: deg(-90) } },
      rightUpperArm: { rotation: { x: 0, y: 0, z: deg(90) } },
      leftElbow: { rotation: { x: 0, y: 0, z: 0 } },
      rightElbow: { rotation: { x: 0, y: 0, z: 0 } },
      leftThigh: { rotation: { x: 0, y: 0, z: 0 } },
      rightThigh: { rotation: { x: 0, y: 0, z: 0 } },
      pelvis: { rotation: { x: 0, y: 0, z: 0 } },
      spine: { rotation: { x: 0, y: 0, z: 0 } },
      chest: { rotation: { x: 0, y: 0, z: 0 } },
      head: { rotation: { x: 0, y: 0, z: 0 } },
    },
    pelvisPosition: [0, 1.0, 0],
  },
  {
    id: 'classical-contrapposto',
    name: 'Classical Contrapposto',
    category: 'dynamic',
    description: 'Weight resting primarily on the right leg, relaxed left knee, angled pelvis counterbalanced by shoulder tilt.',
    transforms: {
      pelvis: { rotation: { x: deg(2), y: deg(5), z: deg(8) } },
      spine: { rotation: { x: deg(-2), y: deg(-3), z: deg(-4) } },
      chest: { rotation: { x: deg(-3), y: deg(-5), z: deg(-7) } },
      head: { rotation: { x: deg(-4), y: deg(12), z: deg(4) } },
      // Right leg bears weight
      rightThigh: { rotation: { x: deg(4), y: deg(0), z: deg(-4) } },
      rightKnee: { rotation: { x: deg(0), y: deg(0), z: deg(0) } },
      rightAnkle: { rotation: { x: deg(-4), y: deg(0), z: deg(4) } },
      // Left leg relaxed
      leftThigh: { rotation: { x: deg(15), y: deg(8), z: deg(6) } },
      leftKnee: { rotation: { x: deg(-32), y: deg(0), z: deg(0) } },
      leftAnkle: { rotation: { x: deg(18), y: deg(0), z: deg(-5) } },
      // Arms relaxed
      leftUpperArm: { rotation: { x: deg(5), y: deg(0), z: deg(-45) } },
      leftElbow: { rotation: { x: deg(24), y: deg(0), z: deg(0) } },
      rightUpperArm: { rotation: { x: deg(-8), y: deg(0), z: deg(42) } },
      rightElbow: { rotation: { x: deg(15), y: deg(0), z: deg(0) } },
    },
    pelvisPosition: [0, 0.98, 0],
  },
  {
    id: 'dynamic-combat',
    name: 'Combat Guard Stance',
    category: 'action',
    description: 'Athletic boxing/martial arts stance with lowered center of gravity, raised guard hands, and angled torso.',
    transforms: {
      pelvis: { rotation: { x: deg(6), y: deg(-25), z: deg(0) } },
      spine: { rotation: { x: deg(8), y: deg(10), z: deg(0) } },
      chest: { rotation: { x: deg(10), y: deg(15), z: deg(0) } },
      head: { rotation: { x: deg(5), y: deg(5), z: deg(0) } },
      // Left lead hand guard
      leftShoulder: { rotation: { x: deg(10), y: deg(0), z: deg(8) } },
      leftUpperArm: { rotation: { x: deg(45), y: deg(20), z: deg(-40) } },
      leftElbow: { rotation: { x: deg(95), y: deg(0), z: deg(0) } },
      leftWrist: { rotation: { x: deg(15), y: deg(0), z: deg(0) } },
      // Right rear hand chin guard
      rightShoulder: { rotation: { x: deg(8), y: deg(0), z: deg(-5) } },
      rightUpperArm: { rotation: { x: deg(35), y: deg(-25), z: deg(30) } },
      rightElbow: { rotation: { x: deg(110), y: deg(0), z: deg(0) } },
      rightWrist: { rotation: { x: deg(20), y: deg(0), z: deg(0) } },
      // Athletic legs
      leftThigh: { rotation: { x: deg(25), y: deg(-10), z: deg(8) } },
      leftKnee: { rotation: { x: deg(-40), y: deg(0), z: deg(0) } },
      leftAnkle: { rotation: { x: deg(15), y: deg(0), z: deg(0) } },
      rightThigh: { rotation: { x: deg(-15), y: deg(-20), z: deg(-12) } },
      rightKnee: { rotation: { x: deg(-35), y: deg(0), z: deg(0) } },
      rightAnkle: { rotation: { x: deg(20), y: deg(0), z: deg(0) } },
    },
    pelvisPosition: [0, 0.90, 0],
  },
  {
    id: 'hero-crouch',
    name: 'Dynamic Hero Crouch',
    category: 'action',
    description: 'Low dynamic 3-point landing stance with deep knee bends and forward thoracic tilt.',
    transforms: {
      pelvis: { rotation: { x: deg(25), y: deg(-15), z: deg(0) } },
      spine: { rotation: { x: deg(22), y: deg(5), z: deg(0) } },
      chest: { rotation: { x: deg(25), y: deg(10), z: deg(0) } },
      head: { rotation: { x: deg(-45), y: deg(0), z: deg(0) } },
      // Legs in deep flexion
      leftThigh: { rotation: { x: deg(85), y: deg(15), z: deg(10) } },
      leftKnee: { rotation: { x: deg(-125), y: deg(0), z: deg(0) } },
      leftAnkle: { rotation: { x: deg(38), y: deg(0), z: deg(0) } },
      rightThigh: { rotation: { x: deg(70), y: deg(-25), z: deg(-15) } },
      rightKnee: { rotation: { x: deg(-110), y: deg(0), z: deg(0) } },
      rightAnkle: { rotation: { x: deg(35), y: deg(0), z: deg(0) } },
      // Right hand touching floor
      rightUpperArm: { rotation: { x: deg(60), y: deg(-15), z: deg(20) } },
      rightElbow: { rotation: { x: deg(40), y: deg(0), z: deg(0) } },
      // Left arm trailing backward
      leftUpperArm: { rotation: { x: deg(-45), y: deg(20), z: deg(-50) } },
      leftElbow: { rotation: { x: deg(60), y: deg(0), z: deg(0) } },
    },
    pelvisPosition: [0, 0.52, 0],
  },
  {
    id: 'seated-study',
    name: 'Seated Gesture Study',
    category: 'seated',
    description: 'Upright seated pose with 90 degree hip flexion and hands resting on knees.',
    transforms: {
      pelvis: { rotation: { x: deg(0), y: deg(0), z: deg(0) } },
      spine: { rotation: { x: deg(4), y: deg(0), z: deg(0) } },
      chest: { rotation: { x: deg(5), y: deg(0), z: deg(0) } },
      head: { rotation: { x: deg(-5), y: deg(0), z: deg(0) } },
      // 90 deg legs
      leftThigh: { rotation: { x: deg(90), y: deg(0), z: deg(6) } },
      leftKnee: { rotation: { x: deg(-90), y: deg(0), z: deg(0) } },
      leftAnkle: { rotation: { x: deg(0), y: deg(0), z: deg(0) } },
      rightThigh: { rotation: { x: deg(90), y: deg(0), z: deg(-6) } },
      rightKnee: { rotation: { x: deg(-90), y: deg(0), z: deg(0) } },
      rightAnkle: { rotation: { x: deg(0), y: deg(0), z: deg(0) } },
      // Hands on thighs
      leftUpperArm: { rotation: { x: deg(25), y: deg(0), z: deg(-20) } },
      leftElbow: { rotation: { x: deg(65), y: deg(0), z: deg(0) } },
      rightUpperArm: { rotation: { x: deg(25), y: deg(0), z: deg(20) } },
      rightElbow: { rotation: { x: deg(65), y: deg(0), z: deg(0) } },
    },
    pelvisPosition: [0, 0.56, 0],
  },
  {
    id: 'dynamic-stride',
    name: 'Mid-Stride Locomotion',
    category: 'dynamic',
    description: 'Walking locomotion gesture capturing contra-rotational shoulder and hip swing.',
    transforms: {
      pelvis: { rotation: { x: deg(2), y: deg(-12), z: deg(0) } },
      spine: { rotation: { x: deg(3), y: deg(6), z: deg(0) } },
      chest: { rotation: { x: deg(5), y: deg(8), z: deg(0) } },
      head: { rotation: { x: deg(0), y: deg(-2), z: deg(0) } },
      // Left leg swings forward
      leftThigh: { rotation: { x: deg(35), y: deg(0), z: deg(4) } },
      leftKnee: { rotation: { x: deg(-15), y: deg(0), z: deg(0) } },
      leftAnkle: { rotation: { x: deg(-10), y: deg(0), z: deg(0) } },
      // Right leg trailing backward
      rightThigh: { rotation: { x: deg(-25), y: deg(0), z: deg(-4) } },
      rightKnee: { rotation: { x: deg(-25), y: deg(0), z: deg(0) } },
      rightAnkle: { rotation: { x: deg(20), y: deg(0), z: deg(0) } },
      // Counter-arm swing (Right forward, Left back)
      rightUpperArm: { rotation: { x: deg(30), y: deg(0), z: deg(25) } },
      rightElbow: { rotation: { x: deg(45), y: deg(0), z: deg(0) } },
      leftUpperArm: { rotation: { x: deg(-25), y: deg(0), z: deg(-25) } },
      leftElbow: { rotation: { x: deg(30), y: deg(0), z: deg(0) } },
    },
    pelvisPosition: [0, 0.96, 0],
  },
];

/**
 * Apply pose transforms to model joint hierarchy
 */
export function applyPoseToModel(jointsOrRig: HumanoidRig | RigJoints, pose: SavedPose): void {
  if ('applyPose' in jointsOrRig) {
    (jointsOrRig as HumanoidRig).applyPose(pose);
    return;
  }

  const joints = jointsOrRig as RigJoints;
  // Reset all joints first
  resetAllJoints(joints);

  // Position pelvis if defined
  if (pose.pelvisPosition && joints.pelvis) {
    joints.pelvis.position.set(
      pose.pelvisPosition[0],
      pose.pelvisPosition[1],
      pose.pelvisPosition[2]
    );
  }

  // Apply rotations
  Object.entries(pose.transforms).forEach(([key, data]) => {
    const jointName = key as JointName;
    const jointGroup = (joints as unknown as Record<string, THREE.Group | undefined>)[jointName];
    if (jointGroup && data?.rotation) {
      jointGroup.rotation.set(
        data.rotation.x,
        data.rotation.y,
        data.rotation.z,
        'XYZ'
      );
    }
  });
}

/**
 * Reset all model joints to zero rotation and baseline height
 */
export function resetAllJoints(jointsOrRig: HumanoidRig | RigJoints): void {
  if ('resetAllJoints' in jointsOrRig) {
    (jointsOrRig as HumanoidRig).resetAllJoints();
    return;
  }

  const joints = jointsOrRig as RigJoints;
  Object.values(joints).forEach((joint) => {
    joint.rotation.set(0, 0, 0);
  });
  if (joints.pelvis) {
    joints.pelvis.position.set(0, 1.0, 0);
  }
}

/**
 * Capture current joint rotations into a serializable SavedPose
 */
export function captureCurrentPose(jointsOrRig: HumanoidRig | RigJoints, name: string): SavedPose {
  if ('capturePose' in jointsOrRig) {
    return (jointsOrRig as HumanoidRig).capturePose(name);
  }

  const joints = jointsOrRig as RigJoints;
  const transforms: PoseTransforms = {};

  (Object.keys(joints) as JointName[]).forEach((key) => {
    const group = (joints as unknown as Record<string, THREE.Group | undefined>)[key];
    if (group) {
      transforms[key] = {
        rotation: {
          x: group.rotation.x,
          y: group.rotation.y,
          z: group.rotation.z,
        },
      };
    }
  });

  return {
    id: `custom_pose_${Date.now()}`,
    name: name.trim() || 'Custom Pose',
    category: 'custom',
    transforms,
    pelvisPosition: joints.pelvis
      ? [joints.pelvis.position.x, joints.pelvis.position.y, joints.pelvis.position.z]
      : [0, 1.0, 0],
    isCustom: true,
  };
}

/**
 * Mirror pose across bilateral symmetry axis (Left <-> Right)
 */
export function mirrorPose(pose: SavedPose): SavedPose {
  const mirroredTransforms: PoseTransforms = {};

  const mirrorMap: Record<string, string> = {
    leftShoulder: 'rightShoulder',
    rightShoulder: 'leftShoulder',
    leftUpperArm: 'rightUpperArm',
    rightUpperArm: 'leftUpperArm',
    leftElbow: 'rightElbow',
    rightElbow: 'leftElbow',
    leftForearm: 'rightForearm',
    rightForearm: 'leftForearm',
    leftWrist: 'rightWrist',
    rightWrist: 'leftWrist',
    leftHand: 'rightHand',
    rightHand: 'leftHand',
    leftHip: 'rightHip',
    rightHip: 'leftHip',
    leftThigh: 'rightThigh',
    rightThigh: 'leftThigh',
    leftKnee: 'rightKnee',
    rightKnee: 'leftKnee',
    leftCalf: 'rightCalf',
    rightCalf: 'leftCalf',
    leftAnkle: 'rightAnkle',
    rightAnkle: 'leftAnkle',
    leftFoot: 'rightFoot',
    rightFoot: 'leftFoot',
    leftThumb: 'rightThumb',
    rightThumb: 'leftThumb',
    leftIndex: 'rightIndex',
    rightIndex: 'leftIndex',
    leftMiddle: 'rightMiddle',
    rightMiddle: 'leftMiddle',
    leftRing: 'rightRing',
    rightRing: 'leftRing',
    leftPinky: 'rightPinky',
    rightPinky: 'leftPinky',
  };

  Object.entries(pose.transforms).forEach(([key, data]) => {
    if (!data) return;
    const counterpart = mirrorMap[key] || key;

    // Invert Y (yaw) and Z (roll) for mirrored bilateral symmetry
    mirroredTransforms[counterpart as JointName] = {
      rotation: {
        x: data.rotation.x,
        y: -data.rotation.y,
        z: -data.rotation.z,
      },
    };
  });

  return {
    ...pose,
    id: `${pose.id}_mirrored`,
    name: `${pose.name} (Mirrored)`,
    transforms: mirroredTransforms,
  };
}
