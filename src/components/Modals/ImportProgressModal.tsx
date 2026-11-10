import React from 'react';
import { UploadCloud, CheckCircle2, X, Sparkles } from 'lucide-react';

export interface ProcessedThumbnail {
  id: string;
  name: string;
  src: string;
  isOptimized: boolean;
}

interface ImportProgressModalProps {
  isOpen: boolean;
  totalCount: number;
  completedCount: number;
  currentFileName: string;
  thumbnails: ProcessedThumbnail[];
  onCancel: () => void;
}

export const ImportProgressModal: React.FC<ImportProgressModalProps> = ({
  isOpen,
  totalCount,
  completedCount,
  currentFileName,
  thumbnails,
  onCancel,
}) => {
  if (!isOpen) return null;

  const percent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;
  const isComplete = completedCount >= totalCount && totalCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#1c1d22]/95 border border-white/10 shadow-2xl backdrop-blur-md text-slate-200 select-none overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#15161a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <UploadCloud className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Importing References</h3>
              <p className="text-[11px] text-slate-400">Optimizing for smooth 60fps canvas performance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            title="Cancel remaining imports"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Progress Indicators */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-300">
                {isComplete
                  ? `Completed ${totalCount} of ${totalCount} images`
                  : `Processing ${completedCount + 1} of ${totalCount}...`}
              </span>
              <span className="font-mono text-xs font-semibold text-blue-400 tabular-nums">
                {percent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 transition-all duration-200 ease-out rounded-full shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Current Filename */}
            <p className="text-[11px] text-slate-400 truncate">
              {currentFileName ? `Optimizing: ${currentFileName}` : 'Finishing import layout...'}
            </p>
          </div>

          {/* Live Thumbnail Strip */}
          {thumbnails.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                <span>Processed ({thumbnails.length})</span>
                <span className="flex items-center gap-1 text-emerald-400 lowercase font-normal">
                  <Sparkles className="w-3 h-3" /> auto-optimized
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-white/10">
                {thumbnails.map((t) => (
                  <div
                    key={t.id}
                    className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 group shadow-md"
                  >
                    <img
                      src={t.src}
                      alt={t.name}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                      <span className="text-[9px] text-slate-200 truncate font-mono w-full">
                        {t.name}
                      </span>
                    </div>
                    {t.isOptimized && (
                      <div
                        title="Optimized for performance"
                        className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500/80 text-white flex items-center justify-center text-[8px]"
                      >
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 bg-[#15161a]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/5 transition-colors"
          >
            {isComplete ? 'Done' : 'Cancel Remaining'}
          </button>
        </div>
      </div>
    </div>
  );
};
