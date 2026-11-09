import { JointConstraint, JointName } from './poseTypes';

const degToRad = (deg: number) => (deg * Math.PI) / 180;

export const JOINT_CONSTRAINTS: Partial<Record<JointName, JointConstraint>> = {
  head: {
    minX: degToRad(-45), // look down
    maxX: degToRad(55),  // look up
    minY: degToRad(-75), // turn right
    maxY: degToRad(75),  // turn left
    minZ: degToRad(-35), // tilt right
    maxZ: degToRad(35),  // tilt left
  },
  neck: {
    minX: degToRad(-25),
    maxX: degToRad(35),
    minY: degToRad(-45),
    maxY: degToRad(45),
    minZ: degToRad(-20),
    maxZ: degToRad(20),
  },
  chest: {
    minX: degToRad(-30),
    maxX: degToRad(35),
    minY: degToRad(-40),
    maxY: degToRad(40),
    minZ: degToRad(-25),
    maxZ: degToRad(25),
  },
  spine: {
    minX: degToRad(-35),
    maxX: degToRad(40),
    minY: degToRad(-30),
    maxY: degToRad(30),
    minZ: degToRad(-20),
    maxZ: degToRad(20),
  },
  // Shoulders (girdle elevation & depression)
  leftShoulder: {
    minX: degToRad(-20),
    maxX: degToRad(30),
    minY: degToRad(-20),
    maxY: degToRad(20),
    minZ: degToRad(-15),
    maxZ: degToRad(30),
  },
  rightShoulder: {
    minX: degToRad(-20),
    maxX: degToRad(30),
    minY: degToRad(-20),
    maxY: degToRad(20),
    minZ: degToRad(-30),
    maxZ: degToRad(15),
  },
  // Upper arms (ball and socket)
  leftUpperArm: {
    minX: degToRad(-160),
    maxX: degToRad(120),
    minY: degToRad(-90),
    maxY: degToRad(90),
    minZ: degToRad(-30),
    maxZ: degToRad(160),
  },
  rightUpperArm: {
    minX: degToRad(-160),
    maxX: degToRad(120),
    minY: degToRad(-90),
    maxY: degToRad(90),
    minZ: degToRad(-160),
    maxZ: degToRad(30),
  },
  // Elbows (hinge joints — bends forward)
  leftElbow: {
    minX: degToRad(0),
    maxX: degToRad(150),
    minY: degToRad(-15),
    maxY: degToRad(15),
    minZ: degToRad(-15),
    maxZ: degToRad(15),
  },
  rightElbow: {
    minX: degToRad(0),
    maxX: degToRad(150),
    minY: degToRad(-15),
    maxY: degToRad(15),
    minZ: degToRad(-15),
    maxZ: degToRad(15),
  },
  // Wrists
  leftWrist: {
    minX: degToRad(-75),
    maxX: degToRad(75),
    minY: degToRad(-60),
    maxY: degToRad(60),
    minZ: degToRad(-40),
    maxZ: degToRad(40),
  },
  rightWrist: {
    minX: degToRad(-75),
    maxX: degToRad(75),
    minY: degToRad(-60),
    maxY: degToRad(60),
    minZ: degToRad(-40),
    maxZ: degToRad(40),
  },
  // Thighs / Hips
  leftThigh: {
    minX: degToRad(-40),
    maxX: degToRad(130),
    minY: degToRad(-45),
    maxY: degToRad(45),
    minZ: degToRad(-30),
    maxZ: degToRad(80),
  },
  rightThigh: {
    minX: degToRad(-40),
    maxX: degToRad(130),
    minY: degToRad(-45),
    maxY: degToRad(45),
    minZ: degToRad(-80),
    maxZ: degToRad(30),
  },
  // Knees (hinge joints — bends backward)
  leftKnee: {
    minX: degToRad(-145),
    maxX: degToRad(0),
    minY: degToRad(-15),
    maxY: degToRad(15),
    minZ: degToRad(-15),
    maxZ: degToRad(15),
  },
  rightKnee: {
    minX: degToRad(-145),
    maxX: degToRad(0),
    minY: degToRad(-15),
    maxY: degToRad(15),
    minZ: degToRad(-15),
    maxZ: degToRad(15),
  },
  // Ankles
  leftAnkle: {
    minX: degToRad(-50),
    maxX: degToRad(35),
    minY: degToRad(-25),
    maxY: degToRad(25),
    minZ: degToRad(-25),
    maxZ: degToRad(25),
  },
  rightAnkle: {
    minX: degToRad(-50),
    maxX: degToRad(35),
    minY: degToRad(-25),
    maxY: degToRad(25),
    minZ: degToRad(-25),
    maxZ: degToRad(25),
  },
};

export function clampJointRotation(joint: JointName, euler: { x: number; y: number; z: number }) {
  const constraint = JOINT_CONSTRAINTS[joint];
  if (!constraint) return euler;

  return {
    x: Math.max(constraint.minX, Math.min(constraint.maxX, euler.x)),
    y: Math.max(constraint.minY, Math.min(constraint.maxY, euler.y)),
    z: Math.max(constraint.minZ, Math.min(constraint.maxZ, euler.z)),
  };
}
