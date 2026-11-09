import React, { useEffect, useState } from 'react';
import { useAppStore } from './AppState';
import { CollapsibleSidebar } from '../components/Sidebar/CollapsibleSidebar';
import { AppHeader } from '../components/Header/AppHeader';
import { Workspace } from './Workspace';
import { NewProjectModal } from '../components/Modals/NewProjectModal';
import { DeleteConfirmModal } from '../components/Modals/DeleteConfirmModal';
import { Project } from '../models/project/Project';
import { projectService } from '../services/storage/projectService';

export const App: React.FC = () => {
  const { initApp, setActiveProject, setActiveDestination, activeProjectId } = useAppStore();

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Initialize IndexedDB storage and seed initial project on mount
  useEffect(() => {
    initApp();
  }, [initApp]);

  const handleCreateProject = async (name: string, description: string) => {
    const { project } = await projectService.createProject(name, description);
    await setActiveProject(project.id);
    setActiveDestination('board');
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    const deletedId = projectToDelete.id;
    await projectService.deleteProject(deletedId);

    if (activeProjectId === deletedId) {
      const remaining = await projectService.listProjects();
      if (remaining.length > 0) {
        await setActiveProject(remaining[0].id);
      } else {
        await setActiveProject(null);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121316] text-slate-100 font-sans antialiased">
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <AppHeader onOpenNewProject={() => setIsNewProjectModalOpen(true)} />

        <div className="flex-1 relative flex flex-col overflow-hidden">
          <Workspace
            onOpenNewProject={() => setIsNewProjectModalOpen(true)}
            onOpenDeleteProject={(p) => setProjectToDelete(p)}
          />
        </div>
      </div>

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />

      <DeleteConfirmModal
        isOpen={projectToDelete !== null}
        projectName={projectToDelete?.name || ''}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
};

export default App;
