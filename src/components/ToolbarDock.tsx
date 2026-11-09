import React from 'react';
import { MousePointer2, Hand, Trash2, ImagePlus, Crosshair } from 'lucide-react';
import { ToolMode } from '../types/canvas';

interface ToolbarDockProps {
  toolMode: ToolMode;
  hasSelection: boolean;
  onSetToolMode: (mode: ToolMode) => void;
  onDeleteSelected: () => void;
  onTriggerImport: () => void;
  onFitAll: () => void;
}

export const ToolbarDock: React.FC<ToolbarDockProps> = ({
  toolMode,
  hasSelection,
  onSetToolMode,
  onDeleteSelected,
  onTriggerImport,
  onFitAll,
}) => {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 rounded-2xl bg-[#1c1d22]/90 border border-white/10 shadow-2xl backdrop-blur-md">
      {/* Select Tool */}
      <button
        type="button"
        onClick={() => onSetToolMode('select')}
        title="Select & Transform Tool (V)"
        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
          toolMode === 'select'
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <MousePointer2 className="w-5 h-5" />
      </button>

      {/* Hand / Pan Tool */}
      <button
        type="button"
        onClick={() => onSetToolMode('pan')}
        title="Hand / Pan Workspace Tool (H / Spacebar)"
        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
          toolMode === 'pan'
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Hand className="w-5 h-5" />
      </button>

      <div className="w-[1px] h-6 bg-white/10 mx-1" />

      {/* Fit View */}
      <button
        type="button"
        onClick={onFitAll}
        title="Frame / Center All References (F)"
        className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <Crosshair className="w-5 h-5" />
      </button>

      {/* Import Quick Button */}
      <button
        type="button"
        onClick={onTriggerImport}
        title="Add Reference Images"
        className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <ImagePlus className="w-5 h-5" />
      </button>

      {/* Delete Selected */}
      {hasSelection && (
        <>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <button
            type="button"
            onClick={onDeleteSelected}
            title="Delete Selected Image (Backspace / Delete)"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/80 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};
