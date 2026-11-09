import React, { useState, useCallback, useRef } from 'react';
import { CameraPreset, StudioLightingSettings } from './types';
import { ThreeCanvasViewport } from './ThreeCanvasViewport';
import { PoseStudioBottomDock } from './PoseStudioBottomDock';
import { useAppStore } from '../../app/AppState';
import { JointName, PoseControlMode, SavedPose } from './poseTypes';
import { BUILTIN_POSES, mirrorPose, captureCurrentPose } from './poseLibrary';
import { SavePoseModal } from '../../components/Modals/SavePoseModal';
import { Export3DSnapshotModal } from '../../components/Modals/Export3DSnapshotModal';

export const PoseStudioModule: React.FC = () => {
  const { currentBoard, updateCurrentBoard } = useAppStore();

  const [lighting, setLighting] = useState<StudioLightingSettings>({
    keyIntensity: 1.5,
    keyAngle: Math.PI / 4, // 45 degrees
    keyElevation: Math.PI / 4, // 45 degrees
    fillIntensity: 0.8,
    rimIntensity: 1.2,
    shadowsEnabled: true,
    shadingMode: 'skin',
    cameraType: 'perspective',
    gender: 'male',
    modelId: 'male',
    jointSpheresVisible: true,
  });

  const [controlMode, setControlMode] = useState<PoseControlMode>('fk');
  const [selectedJoint, setSelectedJoint] = useState<JointName | null>('leftUpperArm');
  const [jointRotations, setJointRotations] = useState<Partial<Record<JointName, { x: number; y: number; z: number }>>>({});
  const [activePreset, setActivePreset] = useState<CameraPreset | null>(null);
  const [targetPoseToApply, setTargetPoseToApply] = useState<SavedPose | null>(null);
  const [currentPoseName, setCurrentPoseName] = useState<string>('Relaxed Standing (A-Pose)');
  const [capturedFeedback, setCapturedFeedback] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [customModelBuffer, setCustomModelBuffer] = useState<ArrayBuffer | null>(null);
  const [customModelName, setCustomModelName] = useState<string | null>(null);

  // Active pose state reference
  const currentPoseRef = useRef<SavedPose>(BUILTIN_POSES[0]);

  const handleUploadCustomGLB = useCallback(async (file: File) => {
    try {
      const { characterModelService } = await import('../../services/assets/characterModelService');
      const buffer = await characterModelService.readFileAsArrayBuffer(file);
      setCustomModelBuffer(buffer);
      setCustomModelName(file.name);
      setLighting((prev) => ({
        ...prev,
        modelId: 'custom',
      }));
      setCapturedFeedback(`Loaded: ${file.name}`);
      setTimeout(() => setCapturedFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to upload custom GLB model:', err);
      setCapturedFeedback('Failed to parse 3D model.');
      setTimeout(() => setCapturedFeedback(null), 3000);
    }
  }, []);

  const handleSelectPreset = useCallback((preset: CameraPreset) => {
    setActivePreset(preset);
  }, []);

  const handlePresetHandled = useCallback(() => {
    setActivePreset(null);
  }, []);

  const handleApplyPose = useCallback((pose: SavedPose) => {
    setTargetPoseToApply(pose);
    currentPoseRef.current = pose;
    setCurrentPoseName(pose.name);
    setCapturedFeedback(`Applied: ${pose.name}`);
    setTimeout(() => setCapturedFeedback(null), 2500);
  }, []);

  const handlePoseApplied = useCallback(() => {
    setTargetPoseToApply(null);
  }, []);

  const handleJointRotated = useCallback((joint: JointName, rot: { x: number; y: number; z: number }) => {
    setJointRotations((prev) => ({
      ...prev,
      [joint]: rot,
    }));
    setCurrentPoseName('Custom Pose (Modified)');
  }, []);

  const handleNudgeJoint = useCallback((axis: 'x' | 'y' | 'z', deltaDegrees: number) => {
    if (!selectedJoint) return;
    const deltaRad = (deltaDegrees * Math.PI) / 180;
    setJointRotations((prev) => {
      const current = prev[selectedJoint] || { x: 0, y: 0, z: 0 };
      const updated = {
        ...current,
        [axis]: current[axis] + deltaRad,
      };
      // Trigger a synthetic pose update with this joint
      const syntheticPose: SavedPose = {
        ...currentPoseRef.current,
        transforms: {
          ...currentPoseRef.current.transforms,
          [selectedJoint]: { rotation: updated },
        },
      };
      setTargetPoseToApply(syntheticPose);
      return {
        ...prev,
        [selectedJoint]: updated,
      };
    });
    setCurrentPoseName('Custom Pose (Nudged)');
  }, [selectedJoint]);

  const handleMirrorPose = useCallback(() => {
    const mirrored = mirrorPose(currentPoseRef.current);
    handleApplyPose(mirrored);
  }, [handleApplyPose]);

  const handleResetJoint = useCallback(() => {
    if (!selectedJoint) return;
    setJointRotations((prev) => ({
      ...prev,
      [selectedJoint]: { x: 0, y: 0, z: 0 },
    }));
    const resetJointPose: SavedPose = {
      ...currentPoseRef.current,
      transforms: {
        ...currentPoseRef.current.transforms,
        [selectedJoint]: { rotation: { x: 0, y: 0, z: 0 } },
      },
    };
    setTargetPoseToApply(resetJointPose);
    setCapturedFeedback(`Reset ${selectedJoint}`);
    setTimeout(() => setCapturedFeedback(null), 2000);
  }, [selectedJoint]);

  const handleResetAllJoints = useCallback(() => {
    const tPose = BUILTIN_POSES.find((p) => p.id === 'neutral-t') || BUILTIN_POSES[1];
    handleApplyPose(tPose);
  }, [handleApplyPose]);

  const handleSavePose = (name: string, category: 'neutral' | 'action' | 'seated' | 'dynamic', description: string) => {
    const newPose: SavedPose = {
      ...currentPoseRef.current,
      id: `saved_pose_${Date.now()}`,
      name,
      category,
      description,
      isCustom: true,
    };
    currentPoseRef.current = newPose;
    setCurrentPoseName(name);
    setCapturedFeedback(`Saved "${name}" to Pose Library!`);
    setTimeout(() => setCapturedFeedback(null), 3000);
  };

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExecuteCapture = async (options: import('../../components/Modals/Export3DSnapshotModal').SnapshotExportOptions) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      const { generate3DSnapshotDataUrl } = await import('../../utils/snapshot3DUtils');
      const dataUrl = await generate3DSnapshotDataUrl(
        canvas,
        currentPoseName,
        lighting.keyAngle,
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
          name: `3D Pose (${currentPoseName}) - ${lighting.shadingMode} view`,
        };

        updateCurrentBoard((prev) => ({
          ...prev,
          elements: [...prev.elements, newElement],
          updatedAt: Date.now(),
        }));
        setCapturedFeedback(`3D Snapshot inserted into ${currentBoard.name}!`);
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `refboard-pose-${Date.now()}.png`;
        a.click();
        setCapturedFeedback('Snapshot downloaded as PNG!');
      }

      setTimeout(() => setCapturedFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to capture snapshot:', err);
      setCapturedFeedback('Snapshot capture failed');
      setTimeout(() => setCapturedFeedback(null), 2500);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#141518] overflow-hidden select-none">
      {/* 3D Viewport Top Action Bar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Model, Rig & Current Pose Status */}
        <div className="pointer-events-auto flex items-center space-x-2.5 bg-[#1e2025]/90 backdrop-blur-md border border-[#2e323b] px-3.5 py-2 rounded-xl shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div>
            <div className="text-[12px] font-semibold text-neutral-100 flex items-center gap-1.5">
              <span>{currentPoseName}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                controlMode === 'fk'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : controlMode === 'ik'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
              }`}>
                {controlMode.toUpperCase()} Mode
              </span>
            </div>
            <div className="text-[10px] text-neutral-400">
              {controlMode === 'fk'
                ? 'Tap bones to rotate with 3-axis gizmo'
                : controlMode === 'ik'
                ? 'Drag cyan/green handles to position limbs'
                : 'Free camera reference navigation'}
            </div>
          </div>
        </div>

        {/* Viewport Actions */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {capturedFeedback && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-xl backdrop-blur-md shadow-md animate-fade-in flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{capturedFeedback}</span>
            </div>
          )}

          <button
            onClick={() => handleSelectPreset('reset')}
            className="flex items-center space-x-1.5 bg-[#1e2025]/90 hover:bg-[#282b32] text-neutral-200 border border-[#2e323b] px-3 py-2 rounded-xl text-xs font-medium shadow-lg transition active:scale-95"
            title="Reset Camera Target"
          >
            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset Camera</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium shadow-lg shadow-blue-600/30 transition active:scale-95"
            title="Configure and snapshot directly into your Reference Board"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Capture Snapshot</span>
          </button>
        </div>
      </div>

      {/* iPad Gesture Hint Overlay */}
      <div className="absolute top-16 left-4 z-10 pointer-events-none hidden sm:flex items-center space-x-2 text-[11px] text-neutral-400/80 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/5">
        <span>Touch: Tap bone to select &bull; Drag arc ring to articulate &bull; Drag background to orbit camera</span>
      </div>

      {/* Primary WebGL Three.js Viewport */}
      <ThreeCanvasViewport
        lighting={lighting}
        controlMode={controlMode}
        selectedJoint={selectedJoint}
        activePreset={activePreset}
        targetPoseToApply={targetPoseToApply}
        customModelBuffer={customModelBuffer}
        onSelectJoint={setSelectedJoint}
        onJointRotated={handleJointRotated}
        onPresetHandled={handlePresetHandled}
        onPoseApplied={handlePoseApplied}
        onCustomModelLoaded={(name) => {
          setCustomModelName(name);
          setLighting((prev) => ({ ...prev, modelId: 'custom' }));
          setCapturedFeedback(`Loaded: ${name}`);
          setTimeout(() => setCapturedFeedback(null), 3000);
        }}
      />

      {/* Interactive Bottom Control Dock */}
      <PoseStudioBottomDock
        lighting={lighting}
        controlMode={controlMode}
        selectedJoint={selectedJoint}
        jointRotations={jointRotations}
        customModelName={customModelName}
        onUpdateLighting={setLighting}
        onSetControlMode={setControlMode}
        onSelectPreset={handleSelectPreset}
        onApplyPose={handleApplyPose}
        onMirrorPose={handleMirrorPose}
        onResetJoint={handleResetJoint}
        onResetAllJoints={handleResetAllJoints}
        onNudgeJoint={handleNudgeJoint}
        onOpenSavePoseModal={() => setIsSaveModalOpen(true)}
        onUploadCustomGLB={handleUploadCustomGLB}
      />

      {/* Save Custom Pose Modal */}
      <SavePoseModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSavePose}
      />

      {/* Configure 3D Snapshot Export Modal */}
      <Export3DSnapshotModal
        isOpen={isExportModalOpen}
        currentPoseName={currentPoseName}
        shadingMode={lighting.shadingMode}
        onClose={() => setIsExportModalOpen(false)}
        onCapture={handleExecuteCapture}
      />
    </div>
  );
};
