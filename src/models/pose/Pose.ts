export interface JointTransform {
  rotation: [number, number, number];
  position?: [number, number, number];
}

export interface Pose {
  id: string;
  projectId?: string;
  modelId: string;
  name: string;
  category?: string;
  jointTransforms: Record<string, JointTransform>;
  createdAt: number;
  updatedAt: number;
}
