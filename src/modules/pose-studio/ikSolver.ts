import * as THREE from 'three';
import { RigJoints } from './humanRigBuilder';
import { IKTargetName } from './poseTypes';
import { HumanoidRig } from './humanoidRigAdapter';

const _vTarget = new THREE.Vector3();
const _vBase = new THREE.Vector3();
const _vDir = new THREE.Vector3();

export interface IKLimbSetup {
  base: THREE.Object3D;
  mid: THREE.Object3D;
  end: THREE.Object3D;
  l1: number;
  l2: number;
  isKnee: boolean;
}

/**
 * Analytical two-bone Inverse Kinematics solver
 */
export function solveTwoBoneIK(
  base: THREE.Object3D,
  mid: THREE.Object3D,
  end: THREE.Object3D,
  targetWorldPos: THREE.Vector3,
  l1: number,
  l2: number,
  isKnee: boolean
): void {
  // 1. Get base world position
  base.getWorldPosition(_vBase);

  // 2. Vector from base to target
  _vDir.subVectors(targetWorldPos, _vBase);
  let dist = _vDir.length();

  // Clamp distance to limb reach limits
  const maxReach = (l1 + l2) * 0.995;
  const minReach = Math.abs(l1 - l2) * 1.05;
  dist = Math.max(minReach, Math.min(maxReach, dist));

  // 3. Law of Cosines for mid-joint (elbow / knee) angle
  // d^2 = l1^2 + l2^2 - 2*l1*l2*cos(pi - midAngle)
  const cosMid = (dist * dist - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  const clampedCosMid = Math.max(-1, Math.min(1, cosMid));
  const midAngle = Math.acos(clampedCosMid);

  // Apply bend: Knee bends backwards (negative X), Elbow bends forwards (positive X)
  mid.rotation.x = isKnee ? -midAngle : midAngle;
  mid.rotation.y = 0;
  mid.rotation.z = 0;

  // 4. Base angle offset
  const cosBaseOffset = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const clampedCosBase = Math.max(-1, Math.min(1, cosBaseOffset));
  const baseOffsetAngle = Math.acos(clampedCosBase);

  // Direction angles to target in base parent space
  if (base.parent) {
    const parentInv = base.parent.matrixWorld.clone().invert();
    const localTarget = targetWorldPos.clone().applyMatrix4(parentInv);
    const localBase = base.position.clone();
    const localDir = localTarget.sub(localBase).normalize();

    // Aim base towards target
    const pitch = -Math.atan2(localDir.z, Math.sqrt(localDir.x * localDir.x + localDir.y * localDir.y));
    const yaw = Math.atan2(localDir.x, -localDir.y);

    base.rotation.x = pitch + (isKnee ? baseOffsetAngle : -baseOffsetAngle);
    base.rotation.z = -yaw * 0.5;
  }
}

/**
 * Execute IK update for requested target
 */
export function updateLimbIK(
  rigOrJoints: HumanoidRig | RigJoints,
  targetName: IKTargetName,
  targetPos: THREE.Vector3
): void {
  const isRig = 'getBone' in rigOrJoints;

  const getPart = (name: 'leftUpperArm' | 'leftElbow' | 'leftWrist' | 'rightUpperArm' | 'rightElbow' | 'rightWrist' | 'leftThigh' | 'leftKnee' | 'leftAnkle' | 'rightThigh' | 'rightKnee' | 'rightAnkle') => {
    if (isRig) {
      return (rigOrJoints as HumanoidRig).getBone(name);
    }
    return (rigOrJoints as RigJoints)[name];
  };

  switch (targetName) {
    case 'leftHand': {
      const base = getPart('leftUpperArm');
      const mid = getPart('leftElbow');
      const end = getPart('leftWrist');
      if (base && mid && end) {
        solveTwoBoneIK(base, mid, end, targetPos, 0.3, 0.28, false);
      }
      break;
    }

    case 'rightHand': {
      const base = getPart('rightUpperArm');
      const mid = getPart('rightElbow');
      const end = getPart('rightWrist');
      if (base && mid && end) {
        solveTwoBoneIK(base, mid, end, targetPos, 0.3, 0.28, false);
      }
      break;
    }

    case 'leftFoot': {
      const base = getPart('leftThigh');
      const mid = getPart('leftKnee');
      const end = getPart('leftAnkle');
      if (base && mid && end) {
        solveTwoBoneIK(base, mid, end, targetPos, 0.44, 0.42, true);
      }
      break;
    }

    case 'rightFoot': {
      const base = getPart('rightThigh');
      const mid = getPart('rightKnee');
      const end = getPart('rightAnkle');
      if (base && mid && end) {
        solveTwoBoneIK(base, mid, end, targetPos, 0.44, 0.42, true);
      }
      break;
    }
  }
}
