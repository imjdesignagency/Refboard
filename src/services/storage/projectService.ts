import { db } from './db';
import { Project } from '../../models/project/Project';
import { Board } from '../../models/board/Board';
import { INITIAL_SAMPLE_ITEMS } from '../../data/sampleReferences';

export interface StorageEstimateResult {
  usedBytes: number;
  quotaBytes: number;
  percent: number;
  formattedUsed: string;
  formattedQuota: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const projectService = {
  async listProjects(): Promise<Project[]> {
    return db.projects.orderBy('updatedAt').reverse().toArray();
  },

  async getProject(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  },

  async createProject(name: string, description?: string): Promise<{ project: Project; defaultBoard: Board }> {
    const now = Date.now();
    const projectId = `proj-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const boardId = `board-${now}-${Math.random().toString(36).substring(2, 7)}`;

    const defaultBoard: Board = {
      id: boardId,
      projectId,
      name: 'Main Reference Board',
      viewport: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        zoom: 0.85,
      },
      elements: [],
      createdAt: now,
      updatedAt: now,
    };

    const project: Project = {
      id: projectId,
      name: name.trim() || 'Untitled Project',
      description: description?.trim() || '',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      boardIds: [boardId],
      sceneIds: [],
      poseIds: [],
      assetIds: [],
    };

    await db.transaction('rw', [db.projects, db.boards], async () => {
      await db.projects.add(project);
      await db.boards.add(defaultBoard);
    });

    return { project, defaultBoard };
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    await db.projects.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async duplicateProject(id: string): Promise<Project | null> {
    const sourceProject = await db.projects.get(id);
    if (!sourceProject) return null;

    const sourceBoards = await db.boards.where('projectId').equals(id).toArray();
    const now = Date.now();
    const newProjectId = `proj-${now}-${Math.random().toString(36).substring(2, 7)}`;

    const newBoards: Board[] = sourceBoards.map((b) => ({
      ...b,
      id: `board-${now}-${Math.random().toString(36).substring(2, 7)}`,
      projectId: newProjectId,
      createdAt: now,
      updatedAt: now,
    }));

    const newProject: Project = {
      ...sourceProject,
      id: newProjectId,
      name: `${sourceProject.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      boardIds: newBoards.map((b) => b.id),
    };

    await db.transaction('rw', [db.projects, db.boards], async () => {
      await db.projects.add(newProject);
      await db.boards.bulkAdd(newBoards);
    });

    return newProject;
  },

  async deleteProject(id: string): Promise<void> {
    await db.transaction('rw', [db.projects, db.boards, db.scenes, db.poses, db.assets], async () => {
      await db.projects.delete(id);
      await db.boards.where('projectId').equals(id).delete();
      await db.scenes.where('projectId').equals(id).delete();
      await db.poses.where('projectId').equals(id).delete();
      await db.assets.where('projectId').equals(id).delete();
    });
  },

  async getBoard(boardId: string): Promise<Board | undefined> {
    return db.boards.get(boardId);
  },

  async listBoardsForProject(projectId: string): Promise<Board[]> {
    return db.boards.where('projectId').equals(projectId).toArray();
  },

  async saveBoard(board: Board): Promise<void> {
    board.updatedAt = Date.now();
    await db.boards.put(board);
    await db.projects.update(board.projectId, { updatedAt: Date.now() });
  },

  async getStorageEstimate(): Promise<StorageEstimateResult> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const used = est.usage || 0;
        const quota = est.quota || 1024 * 1024 * 1024; // fallback 1GB
        const percent = Math.min(100, Math.round((used / quota) * 100));
        return {
          usedBytes: used,
          quotaBytes: quota,
          percent,
          formattedUsed: formatBytes(used),
          formattedQuota: formatBytes(quota),
        };
      } catch {
        // fallback
      }
    }
    return {
      usedBytes: 0,
      quotaBytes: 1024 * 1024 * 1024,
      percent: 0,
      formattedUsed: '0 MB',
      formattedQuota: 'Available',
    };
  },

  async seedInitialDataIfEmpty(): Promise<Project> {
    const existing = await db.projects.toArray();
    if (existing.length > 0) {
      return existing[0];
    }

    const now = Date.now();
    const projectId = 'proj-seed-gilgamesh';
    const boardId = 'board-seed-main';

    const sampleBoard: Board = {
      id: boardId,
      projectId,
      name: 'Character & Anatomy Study',
      viewport: {
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 512,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 384,
        zoom: 0.85,
      },
      elements: INITIAL_SAMPLE_ITEMS.map((item) => ({
        id: item.id,
        type: 'image',
        name: item.name,
        src: item.src,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        rotation: item.rotation,
        opacity: item.opacity,
        zIndex: item.zIndex,
        isLocked: item.isLocked,
        isVisible: item.isVisible !== false,
        isFlippedH: item.isFlippedH,
        isFlippedV: item.isFlippedV,
        aspectRatio: item.aspectRatio,
      })),
      createdAt: now,
      updatedAt: now,
    };

    const seedProject: Project = {
      id: projectId,
      name: 'Gilgamesh Character Development',
      description: 'Historical hero character turnarounds, hand gestures, and Sumerian classical references.',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      boardIds: [boardId],
      sceneIds: [],
      poseIds: [],
      assetIds: [],
    };

    await db.transaction('rw', [db.projects, db.boards], async () => {
      await db.projects.add(seedProject);
      await db.boards.add(sampleBoard);
    });

    return seedProject;
  },
};
