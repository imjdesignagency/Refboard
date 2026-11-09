import React from 'react';
import { Menu, CheckCircle2, Loader2, Plus, FolderKanban } from 'lucide-react';
import { useAppStore } from '../../app/AppState';

interface AppHeaderProps {
  onOpenNewProject: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenNewProject }) => {
  const {
    activeDestination,
    currentProject,
    currentBoard,
    saveStatus,
    toggleSidebar,
    setActiveDestination,
    toggleSplitScreen,
  } = useAppStore();

  const getDestinationTitle = () => {
    switch (activeDestination) {
      case 'projects':
        return 'Projects Hub';
      case 'board':
        return currentBoard ? currentBoard.name : 'Reference Board';
      case 'pose':
        return 'Pose Studio 3D';
      case 'anatomy':
        return 'Learning Centre (Anatomy)';
    }
  };

  return (
    <header className="h-14 w-full bg-[#16171b]/95 border-b border-white/10 px-4 flex items-center justify-between shrink-0 select-none z-20 backdrop-blur-md">
      {/* Left: Mobile/iPad Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          title="Toggle Navigation Menu"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          {currentProject && activeDestination !== 'projects' && (
            <>
              <button
                type="button"
                onClick={() => setActiveDestination('projects')}
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors truncate"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span className="truncate max-w-[150px]">{currentProject.name}</span>
              </button>
              <span className="hidden sm:inline text-slate-600">/</span>
            </>
          )}

          <h1 className="text-sm font-semibold text-white truncate">
            {getDestinationTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Save Status & Actions */}
      <div className="flex items-center gap-3">
        {/* Save Status */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-1.5 text-blue-400 font-mono text-[11px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Saving to IndexedDB...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Local DB Saved</span>
            </span>
          )}
        </div>

        {/* Split Screen Side-by-Side Toggle Button */}
        {activeDestination !== 'projects' && (
          <button
            type="button"
            onClick={() => toggleSplitScreen(activeDestination === 'anatomy' ? 'anatomy' : 'pose')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              useAppStore.getState().isSplitScreen
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/20'
                : 'bg-[#26282f] text-slate-300 border-[#2e323b] hover:bg-[#30333c] hover:text-white'
            }`}
            title="Toggle Split-Screen Side-by-Side Workspace"
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
            <span className="hidden sm:inline">
              {useAppStore.getState().isSplitScreen ? 'Exit Split View' : 'Split View'}
            </span>
          </button>
        )}

        {/* New Project Button */}
        <button
          type="button"
          onClick={onOpenNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-500/20 active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">New Project</span>
        </button>
      </div>
    </header>
  );
};
