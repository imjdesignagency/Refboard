import { create } from 'zustand';
import { Project } from '../models/project/Project';
import { Board } from '../models/board/Board';
import { projectService, StorageEstimateResult } from '../services/storage/projectService';

export type AppDestination = 'projects' | 'board' | 'pose' | 'anatomy';
export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export interface AppState {
  activeDestination: AppDestination;
  activeProjectId: string | null;
  activeBoardId: string | null;
  currentProject: Project | null;
  currentBoard: Board | null;
  isSidebarCollapsed: boolean;
  isSplitScreen: boolean;
  splitDestination: 'pose' | 'anatomy';
  saveStatus: SaveStatus;
  storageQuota: StorageEstimateResult | null;

  // Actions
  setActiveDestination: (destination: AppDestination) => void;
  setActiveProject: (projectId: string | null) => Promise<void>;
  setActiveBoard: (boardId: string | null) => Promise<void>;
  updateCurrentBoard: (updater: (prev: Board) => Board) => Promise<void>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSplitScreen: (splitDest?: 'pose' | 'anatomy') => void;
  setSaveStatus: (status: SaveStatus) => void;
  refreshStorageQuota: () => Promise<void>;
  initApp: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeDestination: 'projects', // User confirmed: Start on Projects view!
  activeProjectId: null,
  activeBoardId: null,
  currentProject: null,
  currentBoard: null,
  isSidebarCollapsed: false,
  isSplitScreen: false,
  splitDestination: 'pose',
  saveStatus: 'saved',
  storageQuota: null,

  setActiveDestination: (destination) => {
    set({ activeDestination: destination });
  },

  setActiveProject: async (projectId) => {
    if (!projectId) {
      set({
        activeProjectId: null,
        activeBoardId: null,
        currentProject: null,
        currentBoard: null,
      });
      return;
    }

    const project = await projectService.getProject(projectId);
    if (!project) return;

    let targetBoard: Board | undefined;
    if (project.boardIds.length > 0) {
      targetBoard = await projectService.getBoard(project.boardIds[0]);
    } else {
      const boards = await projectService.listBoardsForProject(projectId);
      targetBoard = boards[0];
    }

    set({
      activeProjectId: projectId,
      currentProject: project,
      activeBoardId: targetBoard ? targetBoard.id : null,
      currentBoard: targetBoard || null,
    });
  },

  setActiveBoard: async (boardId) => {
    if (!boardId) {
      set({ activeBoardId: null, currentBoard: null });
      return;
    }
    const board = await projectService.getBoard(boardId);
    if (board) {
      set({ activeBoardId: boardId, currentBoard: board });
    }
  },

  updateCurrentBoard: async (updater) => {
    const { currentBoard } = get();
    if (!currentBoard) return;

    set({ saveStatus: 'saving' });
    const updated = updater(currentBoard);
    await projectService.saveBoard(updated);
    set({ currentBoard: updated, saveStatus: 'saved' });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ isSidebarCollapsed: collapsed });
  },

  toggleSplitScreen: (splitDest) => {
    set((state) => ({
      isSplitScreen: !state.isSplitScreen,
      splitDestination: splitDest || state.splitDestination,
      // Ensure we are viewing a board if entering split screen
      activeDestination: !state.isSplitScreen ? 'board' : state.activeDestination,
    }));
  },

  setSaveStatus: (status) => {
    set({ saveStatus: status });
  },

  refreshStorageQuota: async () => {
    const quota = await projectService.getStorageEstimate();
    set({ storageQuota: quota });
  },

  initApp: async () => {
    // Seed initial project if empty
    const seed = await projectService.seedInitialDataIfEmpty();
    const quota = await projectService.getStorageEstimate();

    // Default to 'projects' destination as confirmed by the user
    set({
      activeDestination: 'projects',
      activeProjectId: seed.id,
      currentProject: seed,
      activeBoardId: seed.boardIds[0] || null,
      storageQuota: quota,
    });
  },
}));
