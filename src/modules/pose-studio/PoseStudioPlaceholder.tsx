import React from 'react';
import { UserCheck, Box, Move3d, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../app/AppState';

export const PoseStudioPlaceholder: React.FC = () => {
  const { setActiveDestination, currentProject } = useAppStore();

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#121316] text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1a1c24] to-[#14151a] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Box className="w-3.5 h-3.5" />
              <span>3D Engine Specification — Part 3</span>
            </span>

            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Pose Studio 3D
            </h2>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Real-time 3D human mannequin posing environment designed for character artists and illustrators. Supports full skeletal articulation, Forward Kinematics (FK), Inverse Kinematics (IK), hand controls, and direct 2D reference capture.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveDestination('board')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Layers className="w-4 h-4" />
                <span>Switch to Reference Board</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#18191f] border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Rigged Human Model</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete skeletal hierarchy with anatomical proportions, spine articulation, joint deformation, and natural shoulder/hip ranges.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#18191f] border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Move3d className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">FK & IK Solvers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct joint rotation (FK) and target-based extremity manipulation (IK) for rapid posing of hands, feet, and gestures.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#18191f] border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">2D/3D Integration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capture posed models with custom lighting and camera angles directly to your active reference board with one tap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
