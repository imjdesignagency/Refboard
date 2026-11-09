import React from 'react';
import { AnatomyStructureId } from './anatomyTypes';
import { ANATOMY_STRUCTURES } from './anatomyData';

interface AnatomyInspectorPanelProps {
  selectedId: AnatomyStructureId | null;
  isolatedId: AnatomyStructureId | null;
  onClose: () => void;
  onToggleSolo: (id: AnatomyStructureId) => void;
}

export const AnatomyInspectorPanel: React.FC<AnatomyInspectorPanelProps> = ({
  selectedId,
  isolatedId,
  onClose,
  onToggleSolo,
}) => {
  if (!selectedId) return null;

  const info = ANATOMY_STRUCTURES[selectedId];
  if (!info) return null;

  const isSolo = isolatedId === selectedId;

  return (
    <div className="absolute top-16 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] bg-[#1e2025]/95 backdrop-blur-md border border-[#2e323b] rounded-2xl shadow-2xl p-4 text-neutral-100 animate-fade-in text-xs">
      {/* Header */}
      <div className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-[#2e323b]">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                info.category === 'muscle'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {info.category}
            </span>
            <span className="text-[10px] text-neutral-400 capitalize">
              {info.region.replace('_', ' ')}
            </span>
          </div>
          <h3 className="font-bold text-sm text-neutral-100">{info.name}</h3>
          <p className="text-[11px] text-blue-400 italic font-serif">{info.latinName}</p>
        </div>

        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-[#282b32] transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {/* Origin & Insertion (for muscles) */}
        {info.origin && (
          <div className="bg-[#141518]/70 p-2.5 rounded-xl border border-[#2e323b] space-y-1.5">
            <div>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Origin (Anchor):
              </span>
              <p className="text-[11px] text-neutral-200 leading-snug">{info.origin}</p>
            </div>
            {info.insertion && (
              <div className="pt-1 border-t border-[#2e323b]">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Insertion (Attachment):
                </span>
                <p className="text-[11px] text-neutral-200 leading-snug">{info.insertion}</p>
              </div>
            )}
          </div>
        )}

        {/* Biomechanical Action */}
        <div>
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
            Biomechanical Action:
          </span>
          <p className="text-[11px] text-neutral-300 leading-relaxed bg-[#141518]/50 p-2 rounded-lg border border-[#2e323b]">
            {info.functionDescription}
          </p>
        </div>

        {/* Artist Drawing Tip */}
        <div className="bg-blue-950/30 border border-blue-500/30 p-2.5 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[10px] uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Artist Reference Tip</span>
          </div>
          <p className="text-[11px] text-neutral-200 leading-relaxed">
            {info.artistTip}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <button
            onClick={() => onToggleSolo(selectedId)}
            className={`w-full py-2 px-3 rounded-xl font-semibold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
              isSolo
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{isSolo ? 'Exit Solo Isolation' : 'Solo / Isolate Structure'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
