import Dexie, { type Table } from 'dexie';
import { Project } from '../../models/project/Project';
import { Board } from '../../models/board/Board';
import { Scene } from '../../models/scene/Scene';
import { Pose } from '../../models/pose/Pose';
import { Asset } from '../../models/assets/Asset';

export class RefboardDatabase extends Dexie {
  projects!: Table<Project, string>;
  boards!: Table<Board, string>;
  scenes!: Table<Scene, string>;
  poses!: Table<Pose, string>;
  assets!: Table<Asset, string>;

  constructor() {
    super('RefboardDB');
    this.version(1).stores({
      projects: 'id, name, createdAt, updatedAt',
      boards: 'id, projectId, name, updatedAt',
      scenes: 'id, projectId, name, updatedAt',
      poses: 'id, projectId, modelId, name, updatedAt',
      assets: 'id, projectId, type, name, createdAt',
    });
  }
}

export const db = new RefboardDatabase();
