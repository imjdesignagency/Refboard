import React, { useState } from 'react';
import { X, Download, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { ReferenceItem, ViewportTransform } from '../../types/canvas';
import { exportBoardToPNG, ExportOptions } from '../../utils/exportUtils';

interface ExportBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ReferenceItem[];
  transform: ViewportTransform;
}

export const ExportBoardModal: React.FC<ExportBoardModalProps> = ({
  isOpen,
  onClose,
  items,
  transform,
}) => {
  const [mode, setMode] = useState<'entire-board' | 'viewport'>('entire-board');
  const [transparentBg, setTransparentBg] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(2);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportBoardToPNG(items, transform, {
        mode,
        transparentBg,
        scaleFactor,
      });
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-[#1b1c22] border border-white/10 shadow-2xl overflow-hidden text-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#15161a]">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Export Reference Board</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Export Mode */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Framing Region
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('entire-board')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'entire-board'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-xs">Entire Board</span>
                </div>
                <p className="text-[11px] text-slate-400">All references & markups bounding box</p>
              </button>

              <button
                type="button"
                onClick={() => setMode('viewport')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'viewport'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Maximize2 className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-xs">Current View</span>
                </div>
                <p className="text-[11px] text-slate-400">Only what is currently visible on screen</p>
              </button>
            </div>
          </div>

          {/* Quality & DPI */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Resolution Scale
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScaleFactor(1)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono transition-colors ${
                  scaleFactor === 1
                    ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                1x Standard
              </button>
              <button
                type="button"
                onClick={() => setScaleFactor(2)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono transition-colors ${
                  scaleFactor === 2
                    ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                2x High-Res Retina
              </button>
            </div>
          </div>

          {/* Transparent Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={transparentBg}
              onChange={(e) => setTransparentBg(e.target.checked)}
              className="w-4 h-4 rounded bg-white/10 border-white/20 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-slate-300">Transparent Background (PNG alpha)</span>
          </label>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating PNG...' : 'Download PNG'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
