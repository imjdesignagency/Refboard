export type MuscleGroupId =
  | 'pectoralis'
  | 'deltoids'
  | 'biceps'
  | 'triceps'
  | 'brachioradialis'
  | 'trapezius'
  | 'latissimus'
  | 'abdominals'
  | 'obliques'
  | 'gluteals'
  | 'quadriceps'
  | 'hamstrings'
  | 'gastrocnemius'
  | 'sternocleidomastoid';

export type BoneGroupId =
  | 'cranium'
  | 'cervical'
  | 'ribcage'
  | 'claviclesScapulae'
  | 'pelvis'
  | 'humerus'
  | 'radiusUlna'
  | 'femur'
  | 'patellaTibiaFibula'
  | 'extremities';

export type AnatomyStructureId = MuscleGroupId | BoneGroupId;

export interface AnatomyStructureInfo {
  id: AnatomyStructureId;
  name: string;
  latinName: string;
  category: 'muscle' | 'bone';
  region: 'head_neck' | 'torso' | 'upper_limb' | 'lower_limb';
  origin?: string;
  insertion?: string;
  functionDescription: string;
  artistTip: string;
}

export interface AnatomyLayerSettings {
  skeletonOpacity: number; // 0 to 1
  muscleOpacity: number;   // 0 to 1
  skinOpacity: number;     // 0 to 1
  showLabels: boolean;
  selectedStructureId: AnatomyStructureId | null;
  isolatedStructureId: AnatomyStructureId | null;
  shadingMode: 'color_atlas' | 'clay_sculpt' | 'bone_focus';
  gender: 'male' | 'female';
}
