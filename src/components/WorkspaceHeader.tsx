import React, { useRef } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  Keyboard,
  Layers,
  Activity,
} from 'lucide-react';
import { ViewportTransform } from '../types/canvas';

interface WorkspaceHeaderProps {
  boardTitle: string;
  itemCount: number;
  transform: ViewportTransform;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitAll: () => void;
  onImportImages: (files: FileList) => void;
  onToggleShortcuts: () => void;
  onOpenExport: () => void;
  onOpenSystemCheck?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  boardTitle,
  itemCount,
  transform,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitAll,
  onImportImages,
  onToggleShortcuts,
  onOpenExport,
  onOpenSystemCheck,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportImages(e.target.files);
      e.target.value = '';
    }
  };

  const zoomPercent = Math.round(transform.scale * 100);

  return (
    <header className="h-14 w-full bg-[#16171b]/95 border-b border-white/10 px-3 md:px-5 flex items-center justify-between shrink-0 select-none z-20 backdrop-blur-md">
      {/* Brand & Board Identifier */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wider text-white uppercase">
            REFBOARD
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pl-2 border-l border-white/10">
          <span className="truncate max-w-[200px] text-slate-300 font-medium">{boardTitle}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-400 tabular-nums">{itemCount} {itemCount === 1 ? 'ref' : 'refs'}</span>
        </div>
      </div>

      {/* Center Controls: Undo, Redo, Zoom HUD */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#202227] rounded-lg p-0.5 border border-white/5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl/Cmd + Z)"
            className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl/Cmd + Shift + Z)"
            className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-[#202227] rounded-lg p-0.5 border border-white/5">
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onResetZoom}
            title="Reset Zoom to 100%"
            className="px-2 h-8 flex items-center justify-center text-xs font-mono font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded tabular-nums min-w-[50px] transition-colors"
          >
            {zoomPercent}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In"
            className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onFitAll}
            title="Fit All References into View"
            className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 border-l border-white/5 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Actions: Import & Help */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleShortcuts}
          title="Gestures & Keyboard Shortcuts"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Hidden native input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {onOpenSystemCheck && (
          <button
            type="button"
            onClick={onOpenSystemCheck}
            title="Run Reference Board System Diagnostics & Stress Test"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 hover:text-blue-200 border border-blue-500/30 text-xs font-medium transition-all whitespace-nowrap shadow-sm"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline">System Check</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenExport}
          title="Export Reference Board (PNG)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-medium transition-all whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5 rotate-180 text-blue-400" />
          <span>Export</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
};
