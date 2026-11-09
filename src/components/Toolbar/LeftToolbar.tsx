import React, { useState } from 'react';
import {
  MousePointer2,
  Hand,
  ImagePlus,
  Type,
  Pencil,
  Square,
  Pipette,
  Check,
} from 'lucide-react';
import { ToolMode } from '../../types/canvas';

interface LeftToolbarProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  onTriggerImport: () => void;
  // Pencil options
  pencilColor: string;
  pencilWidth: number;
  onSetPencilColor: (c: string) => void;
  onSetPencilWidth: (w: number) => void;
  // Eyedropper picked color display
  pickedColor: string | null;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  toolMode,
  onSetToolMode,
  onTriggerImport,
  pencilColor,
  pencilWidth,
  onSetPencilColor,
  onSetPencilWidth,
  pickedColor,
}) => {
  const [showPencilOptions, setShowPencilOptions] = useState(false);

  const colors = [
    '#3b82f6', // Cobalt
    '#ef4444', // Red
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ffffff', // White
    '#000000', // Black
  ];

  const strokeWidths = [2, 4, 8];

  return (
    <div className="absolute top-18 left-4 z-20 flex flex-col gap-1.5 select-none">
      <div className="flex flex-col gap-1 p-1 rounded-2xl bg-[#1c1d22]/90 border border-white/10 shadow-2xl backdrop-blur-md">
        {/* Select */}
        <button
          type="button"
          onClick={() => {
            onSetToolMode('select');
            setShowPencilOptions(false);
          }}
          title="Select & Transform Tool (V)"
          className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
            toolMode === 'select'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MousePointer2 className="w-5 h-5" />
        </button>

        {/* Pan */}
        <button
          type="button"
          onClick={() => {
            onSetToolMode('pan');
            setShowPencilOptions(false);
          }}
          title="Hand / Pan Workspace (H / Space)"
          className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
            toolMode === 'pan'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Hand className="w-5 h-5" />
        </button>

        <div className="w-6 h-[1px] bg-white/10 mx-auto my-0.5" />

        {/* Import Image */}
        <button
          type="button"
          onClick={onTriggerImport}
          title="Import Reference Images"
          className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ImagePlus className="w-5 h-5" />
        </button>

        {/* Text Annotation */}
        <button
          type="button"
          onClick={() => {
            onSetToolMode('text');
            setShowPencilOptions(false);
          }}
          title="Add Text Callout / Note (T)"
          className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
            toolMode === 'text'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Type className="w-5 h-5" />
        </button>

        {/* Pencil Drawing */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (toolMode === 'pencil') {
                setShowPencilOptions(!showPencilOptions);
              } else {
                onSetToolMode('pencil');
                setShowPencilOptions(true);
              }
            }}
            title="Pencil / Freehand Annotation (P)"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              toolMode === 'pencil'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Pencil className="w-5 h-5" />
          </button>

          {/* Pencil Options Popover */}
          {showPencilOptions && (
            <div className="absolute left-14 top-0 p-3 rounded-2xl bg-[#1c1d22]/95 border border-white/10 shadow-2xl backdrop-blur-md w-48 space-y-3 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Stroke Thickness
              </div>
              <div className="flex items-center gap-2">
                {strokeWidths.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onSetPencilWidth(w)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-mono border transition-all ${
                      pencilWidth === w
                        ? 'bg-blue-600 border-blue-500 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1 border-t border-white/5">
                Stroke Color
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onSetPencilColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border border-black/30 flex items-center justify-center transition-transform ${
                      pencilColor === c ? 'scale-110 ring-2 ring-blue-500' : 'hover:scale-105'
                    }`}
                  >
                    {pencilColor === c && (
                      <Check className={`w-3.5 h-3.5 ${c === '#ffffff' ? 'text-black' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shape Callout */}
        <button
          type="button"
          onClick={() => {
            onSetToolMode('shape');
            setShowPencilOptions(false);
          }}
          title="Add Reference Callout Box (S)"
          className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
            toolMode === 'shape'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Square className="w-5 h-5" />
        </button>

        {/* Eyedropper Colour Picker */}
        <button
          type="button"
          onClick={() => {
            onSetToolMode('eyedropper');
            setShowPencilOptions(false);
          }}
          title="Eyedropper Colour Picker (I)"
          className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all relative ${
            toolMode === 'eyedropper'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Pipette className="w-5 h-5" />
          {pickedColor && (
            <span
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: pickedColor }}
            />
          )}
        </button>
      </div>
    </div>
  );
};
