import { AppDestination } from './AppState';
import { FolderOpen, Layers, UserCheck, BookOpen } from 'lucide-react';

export interface NavDestinationItem {
  id: AppDestination;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof FolderOpen;
}

export const APP_NAV_ITEMS: NavDestinationItem[] = [
  {
    id: 'projects',
    label: 'Projects Hub',
    shortLabel: 'Projects',
    description: 'Manage boards, scenes & local storage',
    icon: FolderOpen,
  },
  {
    id: 'board',
    label: 'Reference Board',
    shortLabel: 'Board',
    description: '2D infinite visual reference canvas',
    icon: Layers,
  },
  {
    id: 'pose',
    label: 'Pose Studio',
    shortLabel: 'Pose',
    description: '3D mannequin with FK & IK articulation',
    icon: UserCheck,
  },
  {
    id: 'anatomy',
    label: 'Learning Centre',
    shortLabel: 'Anatomy',
    description: 'Skeletal & superficial muscular reference',
    icon: BookOpen,
  },
];
