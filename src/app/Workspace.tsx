import React, { useState } from 'react';
import { useAppStore } from './AppState';
import { ProjectsDashboard } from '../modules/projects/ProjectsDashboard';
import { ReferenceBoardModule } from '../modules/reference-board/ReferenceBoardModule';
import { PoseStudioModule } from '../modules/pose-studio/PoseStudioModule';
import { AnatomyModule } from '../modules/anatomy/AnatomyModule';
import { Project } from '../models/project/Project';

interface WorkspaceProps {
  onOpenNewProject: () => void;
  onOpenDeleteProject: (project: Project) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  onOpenNewProject,
  onOpenDeleteProject,
}) => {
  const { activeDestination, isSplitScreen, splitDestination, toggleSplitScreen } = useAppStore();
  const [splitRatio, setSplitRatio] = useState(50); // Percent split

  // Handle Split Screen Workspace
  if (isSplitScreen && activeDestination !== 'projects') {
    return (
      <div className="relative w-full h-full flex overflow-hidden select-none bg-[#121316]">
        {/* Left Side: 2D Infinite Reference Board */}
        <div
          style={{ width: `${splitRatio}%` }}
          className="relative h-full overflow-hidden border-r border-[#2e323b] shrink-0"
        >
          <ReferenceBoardModule />
        </div>

        {/* Resizable Split Divider */}
        <div
          className="w-1.5 h-full bg-[#2a2d34] hover:bg-blue-500 cursor-col-resize z-30 transition-colors flex items-center justify-center shrink-0 group"
          title="Drag to resize split screen workspace"
          onMouseDown={(e) => {
            e.preventDefault();
            const handleMouseMove = (moveEvent: MouseEvent) => {
              const totalW = window.innerWidth;
              const newRatio = Math.max(20, Math.min(80, (moveEvent.clientX / totalW) * 100));
              setSplitRatio(newRatio);
            };
            const handleMouseUp = () => {
              window.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('mouseup', handleMouseUp);
            };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <div className="w-1 h-8 bg-neutral-500 group-hover:bg-white rounded-full transition-colors" />
        </div>

        {/* Right Side: 3D Reference Studio (Pose or Anatomy) */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Header Switcher inside 3D Pane */}
          <div className="absolute top-3 right-16 z-30 flex items-center space-x-1.5 bg-[#1e2025]/90 backdrop-blur-md border border-[#2e323b] p-0.5 rounded-xl shadow-lg">
            <button
              onClick={() => toggleSplitScreen('pose')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition ${
                splitDestination === 'pose'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Pose 3D
            </button>
            <button
              onClick={() => toggleSplitScreen('anatomy')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition ${
                splitDestination === 'anatomy'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Anatomy 3D
            </button>
          </div>

          {splitDestination === 'anatomy' ? <AnatomyModule /> : <PoseStudioModule />}
        </div>
      </div>
    );
  }

  // Standard Single Module Destinations
  switch (activeDestination) {
    case 'projects':
      return (
        <ProjectsDashboard
          onOpenNewProjectModal={onOpenNewProject}
          onOpenDeleteModal={onOpenDeleteProject}
        />
      );
    case 'board':
      return <ReferenceBoardModule />;
    case 'pose':
      return <PoseStudioModule />;
    case 'anatomy':
      return <AnatomyModule />;
    default:
      return (
        <ProjectsDashboard
          onOpenNewProjectModal={onOpenNewProject}
          onOpenDeleteModal={onOpenDeleteProject}
        />
      );
  }
};
