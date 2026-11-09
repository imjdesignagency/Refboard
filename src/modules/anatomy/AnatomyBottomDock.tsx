import React, { useState } from 'react';
import { AnatomyLayerSettings, AnatomyStructureId } from './anatomyTypes';
import { CameraPreset } from '../pose-studio/types';
import { ANATOMY_STRUCTURES } from './anatomyData';

interface AnatomyBottomDockProps {
  settings: AnatomyLayerSettings;
  onUpdateSettings: (updater: (prev: AnatomyLayerSettings) => AnatomyLayerSettings) => void;
  onSelectStructure: (id: AnatomyStructureId | null) => void;
  onSelectPreset: (preset: CameraPreset) => void;
}

export const AnatomyBottomDock: React.FC<AnatomyBottomDockProps> = ({
  settings,
  onUpdateSettings,
  onSelectStructure,
  onSelectPreset,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'layers' | 'catalog' | 'camera' | 'shading'>('layers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'torso' | 'upper_limb' | 'lower_limb' | 'head_neck'>('all');

  const filteredStructures = Object.values(ANATOMY_STRUCTURES).filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.latinName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || item.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl transition-all duration-200">
      <div className="bg-[#1e2025]/95 backdrop-blur-md border border-[#2e323b] rounded-2xl shadow-2xl p-3 text-xs text-neutral-200">
        {/* Top Header / Tab Bar & Collapse Toggle */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2e323b]">
          <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('layers')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'layers'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#282b32]'
              }`}
            >
              Anatomy Layers
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#282b32]'
              }`}
            >
              Structure Index
            </button>
            <button
              onClick={() => setActiveTab('shading')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'shading'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#282b32]'
              }`}
            >
              Study Shading
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'camera'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#282b32]'
              }`}
            >
              Views
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-[#282b32] transition-colors flex items-center gap-1 ml-2 flex-shrink-0"
            title={isExpanded ? 'Collapse Dock' : 'Expand Dock'}
          >
            <span className="text-[11px] font-medium hidden sm:inline">{isExpanded ? 'Hide' : 'Controls'}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Expandable Content Area */}
        {isExpanded && (
          <div className="pt-1">
            {/* 1. Layers Tab */}
            {activeTab === 'layers' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Skeletal Layer */}
                  <div className="bg-[#141518]/60 p-2.5 rounded-xl border border-[#2e323b] space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-amber-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-300" />
                        Skeletal Bones
                      </span>
                      <span className="text-neutral-400">{Math.round(settings.skeletonOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.skeletonOpacity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateSettings((prev) => ({ ...prev, skeletonOpacity: val }));
                      }}
                      className="w-full accent-amber-300 cursor-pointer h-1.5 bg-[#282b32] rounded-lg"
                    />
                  </div>

                  {/* Muscular Layer */}
                  <div className="bg-[#141518]/60 p-2.5 rounded-xl border border-[#2e323b] space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        Superficial Muscles
                      </span>
                      <span className="text-neutral-400">{Math.round(settings.muscleOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.muscleOpacity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateSettings((prev) => ({ ...prev, muscleOpacity: val }));
                      }}
                      className="w-full accent-rose-400 cursor-pointer h-1.5 bg-[#282b32] rounded-lg"
                    />
                  </div>

                  {/* Skin Contour */}
                  <div className="bg-[#141518]/60 p-2.5 rounded-xl border border-[#2e323b] space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        Skin Envelope
                      </span>
                      <span className="text-neutral-400">{Math.round(settings.skinOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.skinOpacity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateSettings((prev) => ({ ...prev, skinOpacity: val }));
                      }}
                      className="w-full accent-blue-400 cursor-pointer h-1.5 bg-[#282b32] rounded-lg"
                    />
                  </div>
                </div>

                {/* Quick Toggles & Gender Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#2e323b]">
                  <div className="flex items-center space-x-2">
                    {/* Gender Selector */}
                    <div className="inline-flex rounded-lg bg-[#141518] p-0.5 border border-[#2e323b]">
                      <button
                        onClick={() => onUpdateSettings((prev) => ({ ...prev, gender: 'male' }))}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                          settings.gender === 'male'
                            ? 'bg-[#2e323b] text-blue-400'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        Male Figure
                      </button>
                      <button
                        onClick={() => onUpdateSettings((prev) => ({ ...prev, gender: 'female' }))}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                          settings.gender === 'female'
                            ? 'bg-[#2e323b] text-rose-300'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        Female Figure
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          skeletonOpacity: 1,
                          muscleOpacity: 1,
                          skinOpacity: 0,
                          isolatedStructureId: null,
                        }))
                      }
                      className="px-2.5 py-1 bg-[#26282f] hover:bg-[#30333c] text-neutral-300 rounded-lg text-[11px] font-medium border border-[#2e323b] transition"
                    >
                      Reset Layers (Default)
                    </button>
                    {settings.isolatedStructureId && (
                      <button
                        onClick={() =>
                          onUpdateSettings((prev) => ({ ...prev, isolatedStructureId: null }))
                        }
                        className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-medium transition"
                      >
                        Exit Solo Isolation
                      </button>
                    )}
                  </div>

                  {/* 3D Label Pins Toggle */}
                  <button
                    onClick={() =>
                      onUpdateSettings((prev) => ({ ...prev, showLabels: !prev.showLabels }))
                    }
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[11px] font-medium border transition ${
                      settings.showLabels
                        ? 'bg-blue-600/30 text-blue-400 border-blue-500/50'
                        : 'bg-[#26282f] text-neutral-400 border-[#2e323b]'
                    }`}
                  >
                    <span>Landmark Pins</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        settings.showLabels ? 'bg-blue-400' : 'bg-neutral-600'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* 2. Catalog Tab */}
            {activeTab === 'catalog' && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search muscles & bones (e.g. Deltoid, Biceps, Femur)..."
                    className="flex-1 min-w-[160px] bg-[#141518] border border-[#2e323b] focus:border-blue-500 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder-neutral-500 outline-none"
                  />
                  <div className="inline-flex rounded-lg bg-[#141518] p-0.5 border border-[#2e323b]">
                    {(['all', 'torso', 'upper_limb', 'lower_limb', 'head_neck'] as const).map(
                      (region) => (
                        <button
                          key={region}
                          onClick={() => setSelectedRegion(region)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded capitalize transition ${
                            selectedRegion === region
                              ? 'bg-blue-600 text-white'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          {region.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {filteredStructures.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSelectStructure(item.id)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        settings.selectedStructureId === item.id
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-[#2e323b] bg-[#26282f] hover:bg-[#30333c] text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-[11px] truncate">{item.name}</span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded uppercase ${
                            item.category === 'muscle'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 italic truncate">
                        {item.latinName}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Study Shading Tab */}
            {activeTab === 'shading' && (
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                  Anatomical Visual Atlas Modes
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      onUpdateSettings((prev) => ({ ...prev, shadingMode: 'color_atlas' }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      settings.shadingMode === 'color_atlas'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-[#2e323b] bg-[#26282f] text-neutral-300 hover:bg-[#2c2f37]'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">Color Muscle Atlas</div>
                    <div className="text-[9px] text-neutral-400">
                      Color-coded muscle groups for visual distinction
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSettings((prev) => ({ ...prev, shadingMode: 'clay_sculpt' }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      settings.shadingMode === 'clay_sculpt'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-[#2e323b] bg-[#26282f] text-neutral-300 hover:bg-[#2c2f37]'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">Clay Sculpt Study</div>
                    <div className="text-[9px] text-neutral-400">
                      Unified sculptural form and light specular
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSettings((prev) => ({ ...prev, shadingMode: 'bone_focus' }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      settings.shadingMode === 'bone_focus'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-[#2e323b] bg-[#26282f] text-neutral-300 hover:bg-[#2c2f37]'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">Skeletal Focus</div>
                    <div className="text-[9px] text-neutral-400">
                      High-contrast bone with translucent ghost muscles
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Views Tab */}
            {activeTab === 'camera' && (
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                  Orthogonal Study Angles
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  <button
                    onClick={() => onSelectPreset('front')}
                    className="py-2 px-2 bg-[#26282f] hover:bg-[#30333c] text-neutral-200 rounded-lg font-medium transition active:scale-95 text-center"
                  >
                    Front
                  </button>
                  <button
                    onClick={() => onSelectPreset('left')}
                    className="py-2 px-2 bg-[#26282f] hover:bg-[#30333c] text-neutral-200 rounded-lg font-medium transition active:scale-95 text-center"
                  >
                    Left
                  </button>
                  <button
                    onClick={() => onSelectPreset('right')}
                    className="py-2 px-2 bg-[#26282f] hover:bg-[#30333c] text-neutral-200 rounded-lg font-medium transition active:scale-95 text-center"
                  >
                    Right
                  </button>
                  <button
                    onClick={() => onSelectPreset('back')}
                    className="py-2 px-2 bg-[#26282f] hover:bg-[#30333c] text-neutral-200 rounded-lg font-medium transition active:scale-95 text-center"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => onSelectPreset('top')}
                    className="py-2 px-2 bg-[#26282f] hover:bg-[#30333c] text-neutral-200 rounded-lg font-medium transition active:scale-95 text-center"
                  >
                    Top
                  </button>
                  <button
                    onClick={() => onSelectPreset('isometric')}
                    className="py-2 px-2 bg-[#26282f] hover:bg-[#30333c] text-neutral-200 rounded-lg font-medium transition active:scale-95 text-center"
                  >
                    Iso 3/4
                  </button>
                  <button
                    onClick={() => onSelectPreset('reset')}
                    className="py-2 px-2 bg-[#1c2230] hover:bg-[#232b3d] text-blue-400 border border-blue-500/30 rounded-lg font-medium transition active:scale-95 text-center"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
