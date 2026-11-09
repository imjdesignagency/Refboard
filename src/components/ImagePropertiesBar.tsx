import React from 'react';
import {
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Grid3X3,
} from 'lucide-react';
import { ReferenceItem } from '../types/canvas';

interface ImagePropertiesBarProps {
  item: ReferenceItem;
  onUpdate: (updates: Partial<ReferenceItem>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onResetTransform: () => void;
}

export const ImagePropertiesBar: React.FC<ImagePropertiesBarProps> = ({
  item,
  onUpdate,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onResetTransform,
}) => {
  let deg = Math.round((item.rotation * 180) / Math.PI) % 360;
  if (deg < 0) deg += 360;

  return (
    <div className="absolute top-18 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1d22]/90 border border-white/10 shadow-xl backdrop-blur-md text-xs text-slate-300">
      {/* Name / Dimensions */}
      <div className="flex items-center gap-2 pr-2 border-r border-white/10 font-mono text-[11px] text-slate-400">
        <span className="text-white font-sans font-medium text-xs max-w-[120px] truncate">
          {item.name}
        </span>
        <span className="tabular-nums">
          {Math.round(item.width)}×{Math.round(item.height)}
        </span>
        <span className="tabular-nums text-blue-400">{deg}°</span>
      </div>

      {/* Rotate 90 CW */}
      <button
        type="button"
        onClick={() => onUpdate({ rotation: item.rotation + Math.PI / 2 })}
        title="Rotate 90° Clockwise"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 hover:text-white transition-colors"
      >
        <RotateCw className="w-3.5 h-3.5" />
      </button>

      {/* Reset Transform */}
      <button
        type="button"
        onClick={onResetTransform}
        title="Reset Rotation & Scale"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 hover:text-white transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Flip H / V */}
      <button
        type="button"
        onClick={() => onUpdate({ isFlippedH: !item.isFlippedH })}
        title="Flip Horizontally"
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
          item.isFlippedH ? 'bg-blue-600/40 text-blue-400' : 'hover:bg-white/10 hover:text-white'
        }`}
      >
        <FlipHorizontal className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onUpdate({ isFlippedV: !item.isFlippedV })}
        title="Flip Vertically"
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
          item.isFlippedV ? 'bg-blue-600/40 text-blue-400' : 'hover:bg-white/10 hover:text-white'
        }`}
      >
        <FlipVertical className="w-3.5 h-3.5" />
      </button>

      {/* Reference Grid Quick Toggle */}
      <button
        type="button"
        onClick={() => {
          const grid = item.gridOverlay || {
            enabled: false,
            rows: 4,
            columns: 4,
            color: '#38bdf8',
            opacity: 0.85,
            lineWidth: 1.5,
            showNumbering: true,
          };
          onUpdate({ gridOverlay: { ...grid, enabled: !grid.enabled } });
        }}
        title={item.gridOverlay?.enabled ? 'Hide Reference Grid' : 'Show Reference Grid (Proportion Transfer)'}
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
          item.gridOverlay?.enabled
            ? 'bg-blue-600/40 text-blue-400 border border-blue-500/40'
            : 'hover:bg-white/10 hover:text-white'
        }`}
      >
        <Grid3X3 className="w-3.5 h-3.5" />
      </button>

      {/* Layer Stacking */}
      <div className="w-[1px] h-4 bg-white/10" />

      <button
        type="button"
        onClick={onBringForward}
        title="Bring Forward"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 hover:text-white transition-colors"
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={onSendBackward}
        title="Send Backward"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 hover:text-white transition-colors"
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>

      {/* Lock Toggle */}
      <button
        type="button"
        onClick={() => onUpdate({ isLocked: !item.isLocked })}
        title={item.isLocked ? 'Unlock Image' : 'Lock Image Position'}
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
          item.isLocked ? 'text-amber-400 bg-amber-500/20' : 'hover:bg-white/10 hover:text-white'
        }`}
      >
        {item.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
      </button>

      {/* Duplicate */}
      <button
        type="button"
        onClick={onDuplicate}
        title="Duplicate Image (Ctrl/Cmd + D)"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 hover:text-white transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        title="Delete Reference (Backspace)"
        className="w-7 h-7 flex items-center justify-center rounded text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
