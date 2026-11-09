import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ChevronsUp,
  ChevronsDown,
  ChevronUp,
  ChevronDown,
  Crop,
  Layers,
  Group,
  Ungroup,
  Sliders,
  X,
  Grid3X3,
  Hash,
  Palette,
  Minus,
  Plus,
  Check,
} from 'lucide-react';
import { ReferenceItem, ReferenceGridConfig } from '../../types/canvas';

interface RightPropertiesPanelProps {
  selectedItems: ReferenceItem[];
  onUpdateItem: (id: string, updates: Partial<ReferenceItem>) => void;
  onUpdateAllSelected: (updates: Partial<ReferenceItem>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onResetTransform: () => void;
  onStartCrop: () => void;
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
  onClose: () => void;
}

export const RightPropertiesPanel: React.FC<RightPropertiesPanelProps> = ({
  selectedItems,
  onUpdateItem,
  onUpdateAllSelected,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onResetTransform,
  onStartCrop,
  onGroupSelected,
  onUngroupSelected,
  onClose,
}) => {
  if (selectedItems.length === 0) return null;

  const isMulti = selectedItems.length > 1;
  const primaryItem = selectedItems[0];

  let deg = Math.round((primaryItem.rotation * 180) / Math.PI) % 360;
  if (deg < 0) deg += 360;

  const isAnyGrouped = selectedItems.some((it) => !!it.groupId);

  const defaultGridConfig: ReferenceGridConfig = {
    enabled: false,
    rows: 4,
    columns: 4,
    color: '#38bdf8',
    opacity: 0.85,
    lineWidth: 1.5,
    showNumbering: true,
  };

  const grid = primaryItem.gridOverlay || defaultGridConfig;

  const handleUpdateGrid = (patch: Partial<ReferenceGridConfig>) => {
    const newGrid = { ...grid, ...patch };
    onUpdateItem(primaryItem.id, { gridOverlay: newGrid });
  };

  const handleAutoSquareGrid = () => {
    const aspect = (primaryItem.width || 1) / (primaryItem.height || 1);
    const rows = grid.rows || 4;
    const cols = Math.max(2, Math.min(32, Math.round(rows * aspect)));
    handleUpdateGrid({ rows, columns: cols });
  };

  return (
    <div className="absolute top-18 right-4 z-20 w-72 rounded-2xl bg-[#1c1d22]/95 border border-white/10 shadow-2xl backdrop-blur-md text-slate-200 select-none overflow-hidden animate-in fade-in slide-in-from-right-4 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#15161a]">
        <div className="flex items-center gap-2 min-w-0">
          <Sliders className="w-4 h-4 text-blue-400 shrink-0" />
          <h3 className="text-xs font-semibold text-white truncate">
            {isMulti ? `${selectedItems.length} Items Selected` : primaryItem.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto text-xs">
        {/* Transform / Coordinates (single item) */}
        {!isMulti && (
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Transform & Dimensions
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-0.5">X POS</span>
                <span className="font-mono text-white text-xs tabular-nums">{Math.round(primaryItem.x)} px</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-0.5">Y POS</span>
                <span className="font-mono text-white text-xs tabular-nums">{Math.round(primaryItem.y)} px</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-0.5">WIDTH</span>
                <span className="font-mono text-white text-xs tabular-nums">{Math.round(primaryItem.width)} px</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-0.5">HEIGHT</span>
                <span className="font-mono text-white text-xs tabular-nums">{Math.round(primaryItem.height)} px</span>
              </div>
            </div>
          </div>
        )}

        {/* Rotation & Flip Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Rotation ({deg}°)
            </span>
            <button
              type="button"
              onClick={onResetTransform}
              title="Reset Rotation & Scale"
              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdateAllSelected({
                  rotation: (primaryItem.rotation + Math.PI / 2) % (Math.PI * 2),
                })
              }
              className="flex-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>+90°</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateAllSelected({ isFlippedH: !primaryItem.isFlippedH })}
              title="Flip Horizontal"
              className={`p-2 rounded-xl border transition-colors ${
                primaryItem.isFlippedH
                  ? 'bg-blue-600/30 border-blue-500 text-blue-400'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onUpdateAllSelected({ isFlippedV: !primaryItem.isFlippedV })}
              title="Flip Vertical"
              className={`p-2 rounded-xl border transition-colors ${
                primaryItem.isFlippedV
                  ? 'bg-blue-600/30 border-blue-500 text-blue-400'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <FlipVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Opacity
            </span>
            <span className="font-mono text-white tabular-nums">
              {Math.round(primaryItem.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={Math.round(primaryItem.opacity * 100)}
            onChange={(e) =>
              onUpdateAllSelected({ opacity: Number(e.target.value) / 100 })
            }
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Reference Grid Overlay Section */}
        {!isMulti && primaryItem.type === 'image' && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                  Reference Grid
                </span>
              </div>

              {/* Grid Toggle Switch */}
              <button
                type="button"
                onClick={() => handleUpdateGrid({ enabled: !grid.enabled })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  grid.enabled ? 'bg-blue-600' : 'bg-white/15'
                }`}
                title={grid.enabled ? 'Disable Reference Grid' : 'Enable Reference Grid'}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ${
                    grid.enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {grid.enabled && (
              <div className="space-y-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                {/* Presets & Square Ratio Lock */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">Presets</span>
                    <button
                      type="button"
                      onClick={handleAutoSquareGrid}
                      className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                      title="Set rows & columns to produce square grid cells"
                    >
                      Square Cells
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '2×2', r: 2, c: 2 },
                      { label: '3×3', r: 3, c: 3 },
                      { label: '4×4', r: 4, c: 4 },
                      { label: '8×8', r: 8, c: 8 },
                    ].map((p) => {
                      const active = grid.rows === p.r && grid.columns === p.c;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleUpdateGrid({ rows: p.r, columns: p.c })}
                          className={`py-1 rounded-lg text-[11px] font-mono transition-colors border ${
                            active
                              ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-medium'
                              : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rows Count (2-32) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Rows</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateGrid({ rows: Math.max(2, grid.rows - 1) })}
                        className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-300"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="font-mono text-white text-xs w-5 text-center">{grid.rows}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateGrid({ rows: Math.min(32, grid.rows + 1) })}
                        className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-300"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="32"
                    value={grid.rows}
                    onChange={(e) => handleUpdateGrid({ rows: Number(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Columns Count (2-32) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Columns</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateGrid({ columns: Math.max(2, grid.columns - 1) })}
                        className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-300"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="font-mono text-white text-xs w-5 text-center">{grid.columns}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateGrid({ columns: Math.min(32, grid.columns + 1) })}
                        className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-300"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="32"
                    value={grid.columns}
                    onChange={(e) => handleUpdateGrid({ columns: Number(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Grid Color Palette + Custom Picker */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Grid Color</span>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">{grid.color}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[
                      { name: 'Cyan', color: '#38bdf8' },
                      { name: 'Coral', color: '#f87171' },
                      { name: 'Gold', color: '#facc15' },
                      { name: 'White', color: '#ffffff' },
                      { name: 'Emerald', color: '#4ade80' },
                      { name: 'Black', color: '#18181b' },
                    ].map((c) => {
                      const isSelected = grid.color.toLowerCase() === c.color.toLowerCase();
                      return (
                        <button
                          key={c.color}
                          type="button"
                          title={c.name}
                          onClick={() => handleUpdateGrid({ color: c.color })}
                          style={{ backgroundColor: c.color }}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-transform hover:scale-110 ${
                            isSelected
                              ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-[#1c1d22] border-white'
                              : 'border-white/20'
                          }`}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3 h-3 ${
                                c.color === '#ffffff' || c.color === '#facc15'
                                  ? 'text-black'
                                  : 'text-white'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}

                    {/* Custom Hex Color Picker */}
                    <label
                      title="Custom Color"
                      className="relative w-6 h-6 rounded-lg border border-white/20 bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 cursor-pointer flex items-center justify-center overflow-hidden hover:scale-110 transition-transform"
                    >
                      <input
                        type="color"
                        value={grid.color}
                        onChange={(e) => handleUpdateGrid({ color: e.target.value })}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Show Row & Column Numbering */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px] text-slate-300">Numbered Labels (1, 2, 3...)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateGrid({ showNumbering: !grid.showNumbering })}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                      grid.showNumbering
                        ? 'bg-blue-600/30 border-blue-500/40 text-blue-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {grid.showNumbering ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Line Opacity & Thickness */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Opacity</span>
                      <span className="font-mono text-white">
                        {Math.round((grid.opacity ?? 0.85) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="100"
                      value={Math.round((grid.opacity ?? 0.85) * 100)}
                      onChange={(e) => handleUpdateGrid({ opacity: Number(e.target.value) / 100 })}
                      className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Thickness</span>
                      <span className="font-mono text-white">{grid.lineWidth ?? 1.5}px</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 1.5, 2, 3].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => handleUpdateGrid({ lineWidth: w })}
                          className={`flex-1 py-0.5 rounded text-[10px] font-mono border ${
                            (grid.lineWidth ?? 1.5) === w
                              ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Layer Stacking Order */}
        <div className="space-y-2 pt-1 border-t border-white/5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Layer Ordering
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={onBringToFront}
              title="Bring to Front"
              className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center border border-white/5"
            >
              <ChevronsUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onBringForward}
              title="Bring Forward"
              className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center border border-white/5"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onSendBackward}
              title="Send Backward"
              className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center border border-white/5"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onSendToBack}
              title="Send to Back"
              className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center border border-white/5"
            >
              <ChevronsDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lock & Visibility Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={() => onUpdateAllSelected({ isLocked: !primaryItem.isLocked })}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs transition-colors ${
              primaryItem.isLocked
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {primaryItem.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{primaryItem.isLocked ? 'Locked' : 'Unlocked'}</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateAllSelected({ isVisible: !primaryItem.isVisible })}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs transition-colors ${
              !primaryItem.isVisible
                ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {primaryItem.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{primaryItem.isVisible ? 'Visible' : 'Hidden'}</span>
          </button>
        </div>

        {/* Crop & Grouping Actions */}
        <div className="space-y-2 pt-1 border-t border-white/5">
          {!isMulti && primaryItem.type === 'image' && (
            <button
              type="button"
              onClick={onStartCrop}
              className="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center gap-2 text-xs font-medium transition-colors"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Crop Reference Image</span>
            </button>
          )}

          {isMulti && (
            <button
              type="button"
              onClick={isAnyGrouped ? onUngroupSelected : onGroupSelected}
              className="w-full py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center justify-center gap-2 text-xs font-medium transition-colors"
            >
              {isAnyGrouped ? <Ungroup className="w-3.5 h-3.5" /> : <Group className="w-3.5 h-3.5" />}
              <span>{isAnyGrouped ? 'Ungroup Selected' : 'Group Selection'}</span>
            </button>
          )}
        </div>

        {/* Duplicate & Delete Bottom Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onDuplicate}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 flex items-center justify-center gap-1.5 text-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center gap-1.5 text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
