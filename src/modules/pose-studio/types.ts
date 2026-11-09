export type CameraPreset =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'isometric'
  | 'reset';

export type ShadingMode = 'skin' | 'clay' | 'smooth' | 'matcap' | 'wireframe' | 'planar';

export type BodyGender = 'male' | 'female';
export type CharacterModelId = 'male' | 'female' | 'custom';

export interface StudioLightingSettings {
  keyIntensity: number;
  keyAngle: number;       // Azimuthal angle in radians
  keyElevation: number;   // Polar angle in radians
  fillIntensity: number;
  rimIntensity: number;
  shadowsEnabled: boolean;
  shadingMode: ShadingMode;
  cameraType: 'perspective' | 'orthographic';
  gender: BodyGender;
  modelId?: CharacterModelId;
  jointSpheresVisible?: boolean;
}
