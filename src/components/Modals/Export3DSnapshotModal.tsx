import React, { useState } from 'react';

export interface SnapshotExportOptions {
  transparentBackground: boolean;
  includeLightingCompass: boolean;
  includeAngleBadge: boolean;
  scaleFactor: 1 | 2; // 1x or 2x Retina resolution
  targetBoardId: string | null;
}

interface Export3DSnapshotModalProps {
  isOpen: boolean;
  currentPoseName: string;
  shadingMode: string;
  onClose: () => void;
  onCapture: (options: SnapshotExportOptions) => void;
}

export const Export3DSnapshotModal: React.FC<Export3DSnapshotModalProps> = ({
  isOpen,
  currentPoseName,
  shadingMode,
  onClose,
  onCapture,
}) => {
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [includeLightingCompass, setIncludeLightingCompass] = useState(true);
  const [includeAngleBadge, setIncludeAngleBadge] = useState(true);
  const [scaleFactor, setScaleFactor] = useState<1 | 2>(2);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCapture({
      transparentBackground,
      includeLightingCompass,
      includeAngleBadge,
      scaleFactor,
      targetBoardId: null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#1e2025] border border-[#2e323b] rounded-2xl shadow-2xl overflow-hidden text-neutral-100">
        <div className="px-5 py-4 border-b border-[#2e323b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            <h3 className="font-semibold text-base">Capture 3D Reference Snapshot</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-[#282b32] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-[#141518] p-3 rounded-xl border border-[#2e323b] text-xs space-y-1">
            <div className="flex justify-between font-semibold text-neutral-200">
              <span>Pose / View:</span>
              <span className="text-blue-400">{currentPoseName}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Shading Mode:</span>
              <span className="capitalize text-neutral-300">{shadingMode}</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Background Style */}
            <div className="flex items-center justify-between p-3 bg-[#141518]/60 rounded-xl border border-[#2e323b]">
              <div>
                <span className="text-xs font-semibold block text-neutral-200">Transparent Background</span>
                <span className="text-[10px] text-neutral-400 block">Remove dark studio background for seamless drawing overlay</span>
              </div>
              <button
                type="button"
                onClick={() => setTransparentBackground(!transparentBackground)}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  transparentBackground ? 'bg-blue-600' : 'bg-[#2c2f37]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    transparentBackground ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Lighting Angle Stamp */}
            <div className="flex items-center justify-between p-3 bg-[#141518]/60 rounded-xl border border-[#2e323b]">
              <div>
                <span className="text-xs font-semibold block text-neutral-200">Lighting Compass Stamp</span>
                <span className="text-[10px] text-neutral-400 block">Overlay key light direction compass badge on snapshot</span>
              </div>
              <button
                type="button"
                onClick={() => setIncludeLightingCompass(!includeLightingCompass)}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  includeLightingCompass ? 'bg-blue-600' : 'bg-[#2c2f37]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    includeLightingCompass ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Camera Angle Badge */}
            <div className="flex items-center justify-between p-3 bg-[#141518]/60 rounded-xl border border-[#2e323b]">
              <div>
                <span className="text-xs font-semibold block text-neutral-200">Camera Angle Badge</span>
                <span className="text-[10px] text-neutral-400 block">Stamp pose name and camera angle badge</span>
              </div>
              <button
                type="button"
                onClick={() => setIncludeAngleBadge(!includeAngleBadge)}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  includeAngleBadge ? 'bg-blue-600' : 'bg-[#2c2f37]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    includeAngleBadge ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Resolution Scale */}
            <div className="flex items-center justify-between p-3 bg-[#141518]/60 rounded-xl border border-[#2e323b]">
              <div>
                <span className="text-xs font-semibold block text-neutral-200">Export Resolution</span>
                <span className="text-[10px] text-neutral-400 block">2x High-DPI for iPad illustration clarity</span>
              </div>
              <div className="inline-flex rounded-lg bg-[#26282f] p-0.5 border border-[#2e323b]">
                <button
                  type="button"
                  onClick={() => setScaleFactor(1)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                    scaleFactor === 1 ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  1x Standard
                </button>
                <button
                  type="button"
                  onClick={() => setScaleFactor(2)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                    scaleFactor === 2 ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  2x High-DPI
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#2e323b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-[#282b32] rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              Insert to Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
