export interface CameraConfiguration {
  type: 'perspective' | 'orthographic';
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
  zoom?: number;
}

export interface LightingConfiguration {
  mainIntensity: number;
  mainDirection: [number, number, number];
  fillIntensity: number;
  ambientIntensity: number;
  shadowsEnabled: boolean;
  backgroundColor: string;
}

export interface Scene {
  id: string;
  projectId: string;
  name: string;
  modelAssetIds: string[];
  poseId?: string;
  camera: CameraConfiguration;
  lighting: LightingConfiguration;
  createdAt: number;
  updatedAt: number;
}
