import React from 'react';
import {
  FolderOpen,
  Layers,
  UserCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { AppDestination, useAppStore } from '../../app/AppState';

export const CollapsibleSidebar: React.FC = () => {
  const {
    activeDestination,
    setActiveDestination,
    isSidebarCollapsed,
    toggleSidebar,
    currentProject,
    storageQuota,
  } = useAppStore();

  const navItems: {
    id: AppDestination;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'projects',
      label: 'Projects',
      description: 'Boards & scene manager',
      icon: FolderOpen,
    },
    {
      id: 'board',
      label: 'Reference Board',
      description: '2D infinite visual canvas',
      icon: Layers,
    },
    {
      id: 'pose',
      label: 'Pose Studio',
      description: '3D mannequin & IK/FK',
      icon: UserCheck,
    },
    {
      id: 'anatomy',
      label: 'Learning Centre',
      description: 'Skeletal & muscle viewer',
      icon: BookOpen,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#16171b] border-r border-white/10 transition-all duration-200 select-none z-30 shrink-0 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-white/10 bg-[#141518]">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-wider text-white uppercase truncate">
                REFBOARD
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                Studio v1.0
              </span>
            </div>
          </div>
        )}

        {isSidebarCollapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ${
            isSidebarCollapsed ? 'hidden' : 'block'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Mini Toggle Button when collapsed */}
      {isSidebarCollapsed && (
        <div className="py-2 flex justify-center border-b border-white/5">
          <button
            type="button"
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Project Card in Sidebar (when expanded) */}
      {!isSidebarCollapsed && currentProject && (
        <div className="p-3 mx-2 mt-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
            <span>ACTIVE PROJECT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div className="text-xs font-semibold text-white truncate">
            {currentProject.name}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {currentProject.boardIds.length} {currentProject.boardIds.length === 1 ? 'board' : 'boards'} · IndexedDB
          </div>
        </div>
      )}

      {/* Main Navigation Destinations */}
      <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeDestination === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveDestination(item.id)}
              title={item.label}
              className={`w-full flex items-center gap-3 rounded-xl transition-all min-h-[46px] ${
                isSidebarCollapsed ? 'justify-center px-0' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />

              {!isSidebarCollapsed && (
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-xs font-medium text-inherit truncate">
                    {item.label}
                  </span>
                  <span
                    className={`text-[10px] truncate ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage Quota Footer */}
      <div className="p-3 border-t border-white/10 bg-[#141518]/80">
        {!isSidebarCollapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span>IndexedDB Storage</span>
              </span>
              <span className="tabular-nums text-slate-300">
                {storageQuota ? storageQuota.formattedUsed : 'Checking...'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, storageQuota?.percent || 0)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Local IndexedDB Persistence Active">
            <HardDrive className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
    </aside>
  );
};
