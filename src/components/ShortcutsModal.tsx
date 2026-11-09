import React from 'react';
import { X, Touchpad, Keyboard, Smartphone, MousePointer } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#1b1c22] border border-white/10 shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#15161a]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">REFBOARD Navigation & Shortcuts</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* iPad & Touch Gestures */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
              <Smartphone className="w-4 h-4" />
              <span>iPad & Touchscreen Gestures</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block mb-1">Two-Finger Pinch</span>
                <span className="text-slate-400">Smooth zoom in and out centered at fingers</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block mb-1">Two-Finger Drag</span>
                <span className="text-slate-400">Pan and navigate freely across the canvas</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block mb-1">One-Finger / Apple Pencil</span>
                <span className="text-slate-400">Tap to select, drag to reposition reference</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block mb-1">Corner Handles</span>
                <span className="text-slate-400">Drag corners to resize (locks aspect ratio)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 col-span-1 sm:col-span-2">
                <span className="font-semibold text-white block mb-1">Top Rotation Handle</span>
                <span className="text-slate-400">Drag the circular dial to rotate with live degree readout</span>
              </div>
            </div>
          </div>

          {/* Mouse & Keyboard Shortcuts */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
              <MousePointer className="w-4 h-4" />
              <span>Keyboard & Mouse Controls</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300">Pan Workspace</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[11px]">Space + Drag</kbd>
                  <span className="text-slate-500">or</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[11px]">Middle Click</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300">Zoom in / out</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[11px]">Mouse Wheel</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300">Undo Action</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[11px]">Ctrl / Cmd + Z</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300">Redo Action</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[11px]">Ctrl / Cmd + Shift + Z</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300">Duplicate Selected Image</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[11px]">Ctrl / Cmd + D</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300">Delete Selected Image</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[11px]">Backspace / Delete</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300">Fit All References into View</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[11px]">F</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300">Reset Zoom to 100%</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[11px]">0</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#15161a] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
