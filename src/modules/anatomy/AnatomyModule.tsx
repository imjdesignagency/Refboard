import React, { useState, useCallback } from 'react';
import { AnatomyLayerSettings, AnatomyStructureId } from './anatomyTypes';
import { AnatomyViewport } from './AnatomyViewport';
import { AnatomyBottomDock } from './AnatomyBottomDock';
import { AnatomyInspectorPanel } from './AnatomyInspectorPanel';
import { CameraPreset } from '../pose-studio/types';
import { useAppStore } from '../../app/AppState';
import { ANATOMY_STRUCTURES } from './anatomyData';
import { Export3DSnapshotModal } from '../../components/Modals/Export3DSnapshotModal';

export const AnatomyModule: React.FC = () => {
  const { currentBoard, updateCurrentBoard } = useAppStore();

  const [settings, setSettings] = useState<AnatomyLayerSettings>({
    skeletonOpacity: 0.9,
    muscleOpacity: 0.95,
    skinOpacity: 0.0,
    showLabels: true,
    selectedStructureId: 'deltoids',
    isolatedStructureId: null,
    shadingMode: 'color_atlas',
    gender: 'male',
  });

  const [activePreset, setActivePreset] = useState<CameraPreset | null>(null);
  const [capturedFeedback, setCapturedFeedback] = useState<string | null>(null);

  const handleSelectPreset = useCallback((preset: CameraPreset) => {
    setActivePreset(preset);
  }, []);

  const handlePresetHandled = useCallback(() => {
    setActivePreset(null);
  }, []);

  const handleSelectStructure = useCallback((id: AnatomyStructureId | null) => {
    setSettings((prev) => ({
      ...prev,
      selectedStructureId: id,
    }));
  }, []);

  const handleToggleSolo = useCallback((id: AnatomyStructureId) => {
    setSettings((prev) => ({
      ...prev,
      isolatedStructureId: prev.isolatedStructureId === id ? null : id,
    }));
  }, []);

  // Quick preset layer views
  const handleSetLayerPreset = (preset: 'all' | 'muscles' | 'skeleton' | 'ecorche') => {
    switch (preset) {
      case 'all':
        setSettings((prev) => ({
          ...prev,
          skeletonOpacity: 0.85,
          muscleOpacity: 0.95,
          skinOpacity: 0.35,
          isolatedStructureId: null,
        }));
        break;
      case 'muscles':
        setSettings((prev) => ({
          ...prev,
          skeletonOpacity: 0.15,
          muscleOpacity: 1.0,
          skinOpacity: 0.0,
          isolatedStructureId: null,
        }));
        break;
      case 'skeleton':
        setSettings((prev) => ({
          ...prev,
          skeletonOpacity: 1.0,
          muscleOpacity: 0.0,
          skinOpacity: 0.0,
          isolatedStructureId: null,
        }));
        break;
      case 'ecorche':
        setSettings((prev) => ({
          ...prev,
          skeletonOpacity: 0.6,
          muscleOpacity: 0.9,
          skinOpacity: 0.0,
          isolatedStructureId: null,
        }));
        break;
    }
  };

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExecuteCapture = async (options: import('../../components/Modals/Export3DSnapshotModal').SnapshotExportOptions) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      const selectedName = settings.selectedStructureId
        ? ANATOMY_STRUCTURES[settings.selectedStructureId]?.name || 'Anatomy'
        : 'Figure Study';

      const { generate3DSnapshotDataUrl } = await import('../../utils/snapshot3DUtils');
      const dataUrl = await generate3DSnapshotDataUrl(
        canvas,
        `Anatomy (${selectedName})`,
        Math.PI / 4,
        options
      );

      if (currentBoard) {
        const newElement: import('../../models/board/Board').BoardElement = {
          id: `elem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'image',
          x: 220,
          y: 220,
          width: 520,
          height: 390,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          isVisible: true,
          isFlippedH: false,
          isFlippedV: false,
          aspectRatio: 520 / 390,
          zIndex: (currentBoard.elements.length || 0) + 1,
          src: dataUrl,
          name: `Anatomy Study - ${selectedName}`,
        };

        updateCurrentBoard((prev) => ({
          ...prev,
          elements: [...prev.elements, newElement],
          updatedAt: Date.now(),
        }));
        setCapturedFeedback(`3D Anatomy Snapshot inserted into ${currentBoard.name}!`);
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `refboard-anatomy-${Date.now()}.png`;
        a.click();
        setCapturedFeedback('Anatomy snapshot downloaded!');
      }

      setTimeout(() => setCapturedFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to capture anatomy snapshot:', err);
      setCapturedFeedback('Snapshot capture failed');
      setTimeout(() => setCapturedFeedback(null), 2500);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#131417] overflow-hidden select-none">
      {/* Anatomy Viewport Top Action Bar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* System & Mode Header */}
        <div className="pointer-events-auto flex items-center space-x-2.5 bg-[#1e2025]/90 backdrop-blur-md border border-[#2e323b] px-3.5 py-2 rounded-xl shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <div>
            <div className="text-[12px] font-semibold text-neutral-100 flex items-center gap-1.5">
              <span>Human Anatomy Studio</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30 font-medium">
                Dual Skeleton & Muscle Atlas
              </span>
            </div>
            <div className="text-[10px] text-neutral-400">
              Biomechanical landmarks &bull; Superficial muscle origin/insertion notes
            </div>
          </div>
        </div>

        {/* Viewport Actions & Quick Presets */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {capturedFeedback && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-xl backdrop-blur-md shadow-md animate-fade-in flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{capturedFeedback}</span>
            </div>
          )}

          {/* Quick Layer Switcher */}
          <div className="hidden sm:inline-flex rounded-xl bg-[#1e2025]/90 backdrop-blur-md border border-[#2e323b] p-0.5 shadow-lg">
            <button
              onClick={() => handleSetLayerPreset('ecorche')}
              className="px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-[#282b32] transition"
            >
              Écorché
            </button>
            <button
              onClick={() => handleSetLayerPreset('muscles')}
              className="px-2.5 py-1.5 text-[11px] font-medium text-rose-300 hover:text-rose-200 rounded-lg hover:bg-[#282b32] transition"
            >
              Muscles
            </button>
            <button
              onClick={() => handleSetLayerPreset('skeleton')}
              className="px-2.5 py-1.5 text-[11px] font-medium text-amber-300 hover:text-amber-200 rounded-lg hover:bg-[#282b32] transition"
            >
              Skeleton
            </button>
          </div>

          <button
            onClick={() => handleSelectPreset('reset')}
            className="flex items-center space-x-1.5 bg-[#1e2025]/90 hover:bg-[#282b32] text-neutral-200 border border-[#2e323b] px-3 py-2 rounded-xl text-xs font-medium shadow-lg transition active:scale-95"
            title="Reset Viewpoint"
          >
            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium shadow-lg shadow-blue-600/30 transition active:scale-95"
            title="Configure and snapshot anatomy reference directly to board"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Capture Study</span>
          </button>
        </div>
      </div>

      {/* Primary 3D Viewport */}
      <AnatomyViewport
        settings={settings}
        activePreset={activePreset}
        onSelectStructure={handleSelectStructure}
        onPresetHandled={handlePresetHandled}
      />

      {/* Selected Structure Inspector Card */}
      <AnatomyInspectorPanel
        selectedId={settings.selectedStructureId}
        isolatedId={settings.isolatedStructureId}
        onClose={() => handleSelectStructure(null)}
        onToggleSolo={handleToggleSolo}
      />

      {/* Non-occluding Bottom Dock */}
      <AnatomyBottomDock
        settings={settings}
        onUpdateSettings={setSettings}
        onSelectStructure={handleSelectStructure}
        onSelectPreset={handleSelectPreset}
      />

      {/* Configure 3D Anatomy Snapshot Export Modal */}
      <Export3DSnapshotModal
        isOpen={isExportModalOpen}
        currentPoseName={settings.selectedStructureId ? ANATOMY_STRUCTURES[settings.selectedStructureId]?.name || 'Anatomy' : 'Anatomy Model'}
        shadingMode={settings.shadingMode}
        onClose={() => setIsExportModalOpen(false)}
        onCapture={handleExecuteCapture}
      />
    </div>
  );
};
