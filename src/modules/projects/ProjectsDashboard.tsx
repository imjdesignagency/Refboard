import React, { useEffect, useState, useMemo } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Copy,
  Trash2,
  Layers,
  Clock,
  HardDrive,
  ArrowRight,
  FolderKanban,
  FileText,
} from 'lucide-react';
import { Project } from '../../models/project/Project';
import { projectService } from '../../services/storage/projectService';
import { useAppStore } from '../../app/AppState';

interface ProjectsDashboardProps {
  onOpenNewProjectModal: () => void;
  onOpenDeleteModal: (project: Project) => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  onOpenNewProjectModal,
  onOpenDeleteModal,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const {
    activeProjectId,
    setActiveProject,
    setActiveDestination,
    storageQuota,
    refreshStorageQuota,
  } = useAppStore();

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const list = await projectService.listProjects();
      setProjects(list);
      await refreshStorageQuota();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleOpenProject = async (proj: Project) => {
    await setActiveProject(proj.id);
    setActiveDestination('board');
  };

  const handleDuplicate = async (proj: Project) => {
    await projectService.duplicateProject(proj.id);
    await loadProjects();
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  const totalBoardsCount = projects.reduce((acc, p) => acc + (p.boardIds?.length || 0), 0);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#121316] text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome & Action Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <FolderKanban className="w-6 h-6 text-blue-500" />
              <span>Projects Hub</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Persistent local workspaces stored in IndexedDB for concept art and reference boards.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenNewProjectModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>

        {/* Telemetry / Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#18191f] border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                Total Projects
              </span>
              <span className="text-lg font-bold text-white tabular-nums">
                {projects.length}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#18191f] border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                Reference Boards
              </span>
              <span className="text-lg font-bold text-white tabular-nums">
                {totalBoardsCount}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#18191f] border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                IndexedDB Quota
              </span>
              <span className="text-lg font-bold text-white tabular-nums">
                {storageQuota?.formattedUsed || '0 MB'}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  / {storageQuota?.formattedQuota || 'Available'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#18191f] border border-white/10 text-white placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Project Cards Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Loading projects from IndexedDB...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#18191f]/50 border border-white/10 space-y-3">
            <FileText className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No projects found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search term or clear the filter.'
                : 'Create your first project to start organizing visual references and 3D study scenes.'}
            </p>
            <button
              type="button"
              onClick={onOpenNewProjectModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              const dateStr = new Date(proj.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={proj.id}
                  className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-[#18191f] border transition-all ${
                    isActive
                      ? 'border-blue-500/80 shadow-lg shadow-blue-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Active status & action menu */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                          <FolderOpen className="w-4 h-4" />
                        </div>
                        {isActive && (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Current Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(proj)}
                          title="Duplicate Project"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDeleteModal(proj)}
                          title="Delete Project"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Project Title & Description */}
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {proj.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                        {proj.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-500" />
                        <span>{proj.boardIds.length} {proj.boardIds.length === 1 ? 'board' : 'boards'}</span>
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="tabular-nums">{dateStr}</span>
                      </span>
                    </div>
                  </div>

                  {/* Open Project Button */}
                  <div className="pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenProject(proj)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-medium transition-all"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
