export interface Project {
  id: string;
  name: string;
  description?: string;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;

  boardIds: string[];
  sceneIds: string[];
  poseIds: string[];
  assetIds: string[];
}
