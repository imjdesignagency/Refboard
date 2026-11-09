import React from 'react';
import { BookOpen, Activity, Eye, Layers } from 'lucide-react';
import { useAppStore } from '../../app/AppState';

export const AnatomyPlaceholder: React.FC = () => {
  const { setActiveDestination } = useAppStore();

  const skeletalGroups = [
    'Cranial & Facial Bones',
    'Spinal Column & Rib Cage',
    'Pelvic Girdle & Femur',
    'Shoulder Girdle (Clavicle & Scapula)',
    'Upper Limb (Humerus, Radius, Ulna)',
    'Carpals, Metacarpals & Phalanges',
  ];

  const muscleGroups = [
    'Trapezius & Deltoid Complex',
    'Pectoralis Major & Serratus Anterior',
    'Latissimus Dorsi & Erector Spinae',
    'Biceps Brachii & Triceps Brachii',
    'Rectus Abdominis & External Obliques',
    'Gluteal Complex & Quadriceps Femoris',
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#121316] text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1a1c24] to-[#14151a] border border-white/10 shadow-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Activity className="w-3.5 h-3.5" />
            <span>Anatomy Engine Specification — Part 4</span>
          </span>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Learning Centre — Anatomy Reference
          </h2>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Interactive 3D skeletal and superficial muscle reference viewer designed specifically for visual artists. Teaches how underlying bone landmarks and muscle bellies dictate form, movement, and silhouette.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveDestination('board')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Return to Reference Board</span>
            </button>
          </div>
        </div>

        {/* Anatomical Systems Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Skeleton */}
          <div className="p-5 rounded-2xl bg-[#18191f] border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Skeletal Architecture</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Part 4.2</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {skeletalGroups.map((g) => (
                <li key={g} className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-white/[0.02]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Muscular */}
          <div className="p-5 rounded-2xl bg-[#18191f] border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Superficial Musculature</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Part 4.2</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {muscleGroups.map((g) => (
                <li key={g} className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-white/[0.02]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
