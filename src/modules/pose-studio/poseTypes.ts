export type JointName =
  | 'pelvis'
  | 'spine'
  | 'chest'
  | 'neck'
  | 'head'
  | 'leftShoulder'
  | 'leftUpperArm'
  | 'leftElbow'
  | 'leftForearm'
  | 'leftWrist'
  | 'leftHand'
  | 'rightShoulder'
  | 'rightUpperArm'
  | 'rightElbow'
  | 'rightForearm'
  | 'rightWrist'
  | 'rightHand'
  | 'leftHip'
  | 'leftThigh'
  | 'leftKnee'
  | 'leftCalf'
  | 'leftAnkle'
  | 'leftFoot'
  | 'rightHip'
  | 'rightThigh'
  | 'rightKnee'
  | 'rightCalf'
  | 'rightAnkle'
  | 'rightFoot'
  // Hand fingers & thumb controls
  | 'leftThumb'
  | 'leftIndex'
  | 'leftMiddle'
  | 'leftRing'
  | 'leftPinky'
  | 'rightThumb'
  | 'rightIndex'
  | 'rightMiddle'
  | 'rightRing'
  | 'rightPinky';

export type PoseControlMode = 'view' | 'fk' | 'ik';

export type IKTargetName = 'leftHand' | 'rightHand' | 'leftFoot' | 'rightFoot';

export interface JointRotation {
  x: number; // in radians
  y: number; // in radians
  z: number; // in radians
}

export interface JointTransformData {
  rotation: JointRotation;
  position?: [number, number, number];
}

export type PoseTransforms = Partial<Record<JointName, JointTransformData>>;

export interface SavedPose {
  id: string;
  name: string;
  category: 'neutral' | 'action' | 'seated' | 'dynamic' | 'custom';
  description?: string;
  transforms: PoseTransforms;
  pelvisPosition?: [number, number, number];
  isCustom?: boolean;
}

export interface JointConstraint {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}
