import React, { useState } from 'react';
import { CameraPreset, ShadingMode, StudioLightingSettings } from './types';
import { JointName, PoseControlMode, SavedPose } from './poseTypes';
import { BUILTIN_POSES } from './poseLibrary';

interface PoseStudioBottomDockProps {
  lighting: StudioLightingSettings;
  controlMode: PoseControlMode;
  selectedJoint: JointName | null;
  jointRotations: Partial<Record<JointName, { x: number; y: number; z: number }>>;
  customModelName?: string | null;
  onUpdateLighting: (updater: (prev: StudioLightingSettings) => StudioLightingSettings) => void;
  onSetControlMode: (mode: PoseControlMode) => void;
  onSelectPreset: (preset: CameraPreset) => void;
  onApplyPose: (pose: SavedPose) => void;
  onMirrorPose: () => void;
  onResetJoint: () => void;
  onResetAllJoints: () => void;
  onNudgeJoint: (axis: 'x' | 'y' | 'z', deltaDegrees: number) => void;
  onOpenSavePoseModal: () => void;
  onUploadCustomGLB?: (file: File) => void;
}

export const PoseStudioBottomDock: React.FC<PoseStudioBottomDockProps> = ({
  lighting,
  controlMode,
  selectedJoint,
  jointRotations,
  customModelName,
  onUpdateLighting,
  onSetControlMode,
  onSelectPreset,
  onApplyPose,
  onMirrorPose,
  onResetJoint,
  onResetAllJoints,
  onNudgeJoint,
  onOpenSavePoseModal,
  onUploadCustomGLB,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'pose' | 'library' | 'camera' | 'lighting'>('pose');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const degreesFromRad = (rad: number) => Math.round((rad * 180) / Math.PI);
  const radFromDegrees = (deg: number) => (deg * Math.PI) / 180;

  // Selected joint formatted name
  const formatJointName = (name: JointName | null) => {
    if (!name) return 'None Selected';
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const currentJointRot = selectedJoint ? jointRotations[selectedJoint] : null;

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl transition-all duration-200">
      <div className="bg-[#1e2025]/95 backdrop-blur-md border border-[#2e323b] rounded-2xl shadow-2xl p-3 text-xs text-neutral-200">
        {/* Top Header / Tab Bar & Collapse Toggle */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2e323b]">
          <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('pose')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'pose'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#282b32]'
              }`}
            >
              Pose & Rig
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'library'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#282b32]'
              }`}
            >
              Pose Library
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'camera'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#282b32]'
              }`}
            >
              Camera
            </button>
            <button
              onClick={() => setActiveTab('lighting')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'lighting'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#282b32]'
              }`}
            >
              Lighting & Shading
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
            {/* 1. Pose & Rig Tab */}
            {activeTab === 'pose' && (
              <div className="space-y-2.5">
                {/* Mode Selector, Gender Selector & Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    {/* FK/IK Mode Selector */}
                    <div className="inline-flex rounded-lg bg-[#141518] p-0.5 border border-[#2e323b]">
                      <button
                        onClick={() => onSetControlMode('fk')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                          controlMode === 'fk'
                            ? 'bg-blue-600 text-white'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                        title="Forward Kinematics: Click joint to rotate bones with gizmo"
                      >
                        FK Mode
                      </button>
                      <button
                        onClick={() => onSetControlMode('ik')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                          controlMode === 'ik'
                            ? 'bg-blue-600 text-white'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                        title="Inverse Kinematics: Drag hand & foot target handles"
                      >
                        IK Mode
                      </button>
                      <button
                        onClick={() => onSetControlMode('view')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                          controlMode === 'view'
                            ? 'bg-blue-600 text-white'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                        title="Camera only: No gizmos or selection handles"
                      >
                        View
                      </button>
                    </div>

                    {/* Human Character Model Selector */}
                    <div className="inline-flex rounded-lg bg-[#141518] p-0.5 border border-[#2e323b]">
                      <button
                        onClick={() => onUpdateLighting((prev) => ({ ...prev, gender: 'male', modelId: 'male' }))}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                          (lighting.modelId === 'male' || (!lighting.modelId && lighting.gender === 'male'))
                            ? 'bg-[#2e323b] text-blue-400 font-semibold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                        title="Athletic Male Character Model (Xbot)"
                      >
                        Male (Athletic)
                      </button>
                      <button
                        onClick={() => onUpdateLighting((prev) => ({ ...prev, gender: 'female', modelId: 'female' }))}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                          (lighting.modelId === 'female' || (!lighting.modelId && lighting.gender === 'female'))
                            ? 'bg-[#2e323b] text-rose-300 font-semibold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                        title="Athletic Female Character Model (Michelle)"
                      >
                        Female (Athletic)
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
                          lighting.modelId === 'custom'
                            ? 'bg-[#2e323b] text-emerald-400 font-semibold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                        title="Upload your own rigged GLB/glTF 3D model"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>{customModelName ? customModelName.slice(0, 10) + '...' : 'Upload GLB'}</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".glb,.gltf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && onUploadCustomGLB) {
                            onUploadCustomGLB(file);
                          }
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <button
                      onClick={() =>
                        onUpdateLighting((prev) => ({
                          ...prev,
                          jointSpheresVisible: prev.jointSpheresVisible === false ? true : false,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition active:scale-95 flex items-center gap-1.5 ${
                        lighting.jointSpheresVisible !== false
                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                          : 'bg-[#26282f] border-[#2e323b] text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Toggle Magic Poser glowing joint sphere handles"
                    >
                      <span className={`w-2 h-2 rounded-full ${lighting.jointSpheresVisible !== false ? 'bg-blue-400' : 'bg-neutral-500'}`} />
                      <span>Joint Handles: {lighting.jointSpheresVisible !== false ? 'ON' : 'OFF'}</span>
                    </button>
                    <button
                      onClick={onMirrorPose}
                      className="px-2.5 py-1 bg-[#26282f] hover:bg-[#30333c] text-neutral-300 rounded-lg text-[11px] font-medium border border-[#2e323b] transition active:scale-95"
                      title="Mirror bilateral symmetry (swaps left and right)"
                    >
                      Mirror Pose
                    </button>
                    {selectedJoint && (
                      <button
                        onClick={onResetJoint}
                        className="px-2.5 py-1 bg-[#26282f] hover:bg-[#30333c] text-amber-300 rounded-lg text-[11px] font-medium border border-[#2e323b] transition active:scale-95"
                        title="Reset selected joint rotation to zero"
                      >
                        Reset Joint
                      </button>
                    )}
                    <button
                      onClick={onResetAllJoints}
                      className="px-2.5 py-1 bg-[#26282f] hover:bg-[#30333c] text-rose-300 rounded-lg text-[11px] font-medium border border-[#2e323b] transition active:scale-95"
                      title="Reset entire skeletal pose to baseline"
                    >
                      Reset All
                    </button>
                  </div>
                </div>

                {/* Selected Joint Fine-Tuning Inspector */}
                {controlMode === 'fk' && (
                  <div className="bg-[#141518]/60 p-2.5 rounded-xl border border-[#2e323b] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                          Selected Joint:
                        </span>
                        <span className="text-[12px] font-semibold text-blue-400">
                          {formatJointName(selectedJoint)}
                        </span>
                      </div>
                      {!selectedJoint && (
                        <span className="text-[11px] text-neutral-500 italic">
                          Tap any bone or joint in viewport to rotate
                        </span>
                      )}
                    </div>

                    {selectedJoint && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {/* Pitch (X) */}
                        <div className="bg-[#1e2025] p-2 rounded-lg border border-[#2e323b]">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-1">
                            <span>Pitch (X)</span>
                            <span className="font-mono text-neutral-200">
                              {degreesFromRad(currentJointRot?.x || 0)}°
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <button
                              onClick={() => onNudgeJoint('x', -5)}
                              className="px-2 py-0.5 bg-[#2a2d34] hover:bg-[#363a43] rounded font-bold text-neutral-300"
                            >
                              -5°
                            </button>
                            <button
                              onClick={() => onNudgeJoint('x', 5)}
                              className="px-2 py-0.5 bg-[#2a2d34] hover:bg-[#363a43] rounded font-bold text-neutral-300"
                            >
                              +5°
                            </button>
                          </div>
                        </div>

                        {/* Yaw (Y) */}
                        <div className="bg-[#1e2025] p-2 rounded-lg border border-[#2e323b]">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-1">
                            <span>Yaw (Y)</span>
                            <span className="font-mono text-neutral-200">
                              {degreesFromRad(currentJointRot?.y || 0)}°
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <button
                              onClick={() => onNudgeJoint('y', -5)}
                              className="px-2 py-0.5 bg-[#2a2d34] hover:bg-[#363a43] rounded font-bold text-neutral-300"
                            >
                              -5°
                            </button>
                            <button
                              onClick={() => onNudgeJoint('y', 5)}
                              className="px-2 py-0.5 bg-[#2a2d34] hover:bg-[#363a43] rounded font-bold text-neutral-300"
                            >
                              +5°
                            </button>
                          </div>
                        </div>

                        {/* Roll (Z) */}
                        <div className="bg-[#1e2025] p-2 rounded-lg border border-[#2e323b]">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-1">
                            <span>Roll (Z)</span>
                            <span className="font-mono text-neutral-200">
                              {degreesFromRad(currentJointRot?.z || 0)}°
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <button
                              onClick={() => onNudgeJoint('z', -5)}
                              className="px-2 py-0.5 bg-[#2a2d34] hover:bg-[#363a43] rounded font-bold text-neutral-300"
                            >
                              -5°
                            </button>
                            <button
                              onClick={() => onNudgeJoint('z', 5)}
                              className="px-2 py-0.5 bg-[#2a2d34] hover:bg-[#363a43] rounded font-bold text-neutral-300"
                            >
                              +5°
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. Pose Library Tab */}
            {activeTab === 'library' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Anatomical & Gesture Pose Presets
                  </span>
                  <button
                    onClick={onOpenSavePoseModal}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-medium transition active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Save Current Pose</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {BUILTIN_POSES.map((pose) => (
                    <button
                      key={pose.id}
                      onClick={() => onApplyPose(pose)}
                      className="p-2.5 bg-[#26282f] hover:bg-[#30333c] border border-[#2e323b] hover:border-blue-500/50 rounded-xl text-left transition-all group active:scale-95"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-neutral-200 text-[11px] group-hover:text-blue-400 truncate">
                          {pose.name}
                        </span>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-black/40 text-neutral-400 uppercase">
                          {pose.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 line-clamp-2 leading-tight">
                        {pose.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Camera Tab */}
            {activeTab === 'camera' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Camera Presets
                  </span>
                  <div className="inline-flex rounded-lg bg-[#141518] p-0.5 border border-[#2e323b]">
                    <button
                      onClick={() =>
                        onUpdateLighting((prev) => ({ ...prev, cameraType: 'perspective' }))
                      }
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                        lighting.cameraType === 'perspective'
                          ? 'bg-[#2e323b] text-blue-400'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Perspective
                    </button>
                    <button
                      onClick={() =>
                        onUpdateLighting((prev) => ({ ...prev, cameraType: 'orthographic' }))
                      }
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                        lighting.cameraType === 'orthographic'
                          ? 'bg-[#2e323b] text-blue-400'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Orthographic
                    </button>
                  </div>
                </div>

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

            {/* 4. Lighting & Shading Tab */}
            {activeTab === 'lighting' && (
              <div className="space-y-3">
                {/* Shading mode selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Material Shading
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    <button
                      onClick={() =>
                        onUpdateLighting((prev) => ({ ...prev, shadingMode: 'skin' }))
                      }
                      className={`py-1.5 px-2 rounded-lg border text-left transition-all ${
                        lighting.shadingMode === 'skin'
                          ? 'border-blue-500 bg-blue-500/15 text-white'
                          : 'border-[#2e323b] bg-[#26282f] text-neutral-300 hover:bg-[#2c2f37]'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">Studio Skin</div>
                      <div className="text-[9px] text-neutral-400">Photorealistic tone</div>
                    </button>

                    <button
                      onClick={() =>
                        onUpdateLighting((prev) => ({ ...prev, shadingMode: 'clay' }))
                      }
                      className={`py-1.5 px-2 rounded-lg border text-left transition-all ${
                        lighting.shadingMode === 'clay'
                          ? 'border-blue-500 bg-blue-500/15 text-white'
                          : 'border-[#2e323b] bg-[#26282f] text-neutral-300 hover:bg-[#2c2f37]'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">Clay Studio</div>
                      <div className="text-[9px] text-neutral-400">Sculptural form</div>
                    </button>

                    <button
                      onClick={() =>
                        onUpdateLighting((prev) => ({ ...prev, shadingMode: 'smooth' }))
                      }
                      className={`py-1.5 px-2 rounded-lg border text-left transition-all ${
                        lighting.shadingMode === 'smooth'
                          ? 'border-blue-500 bg-blue-500/15 text-white'
                          : 'border-[#2e323b] bg-[#26282f] text-neutral-300 hover:bg-[#2c2f37]'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">Smooth PBR</div>
                      <div className="text-[9px] text-neutral-400">Satin sheen</div>
                    </button>

                    <button
                      onClick={() =>
                        onUpdateLighting((prev) => ({ ...prev, shadingMode: 'matcap' }))
                      }
                      className={`py-1.5 px-2 rounded-lg border text-left transition-all ${
                        lighting.shadingMode === 'matcap'
                          ? 'border-blue-500 bg-blue-500/15 text-white'
                          : 'border-[#2e323b] bg-[#26282f] text-neutral-300 hover:bg-[#2c2f37]'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">Matcap</div>
                      <div className="text-[9px] text-neutral-400">Unlit value study</div>
                    </button>

                    <button
                      onClick={() =>
                        onUpdateLighting((prev) => ({ ...prev, shadingMode: 'wireframe' }))
                      }
                      className={`py-1.5 px-2 rounded-lg border text-left transition-all ${
                        lighting.shadingMode === 'wireframe'
                          ? 'border-blue-500 bg-blue-500/15 text-white'
                          : 'border-[#2e323b] bg-[#26282f] text-neutral-300 hover:bg-[#2c2f37]'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">Wireframe</div>
                      <div className="text-[9px] text-neutral-400">Contour cage</div>
                    </button>
                  </div>
                </div>

                {/* Lighting Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="space-y-1 bg-[#141518]/50 p-2 rounded-xl border border-[#2e323b]">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-medium text-amber-300">Key Azimuth</span>
                      <span className="text-neutral-400">{degreesFromRad(lighting.keyAngle)}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={degreesFromRad(lighting.keyAngle)}
                      onChange={(e) => {
                        const deg = Number(e.target.value);
                        onUpdateLighting((prev) => ({ ...prev, keyAngle: radFromDegrees(deg) }));
                      }}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-[#282b32] rounded-lg"
                    />

                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="text-neutral-400">Elevation</span>
                      <span className="text-neutral-400">{degreesFromRad(lighting.keyElevation)}°</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={85}
                      value={degreesFromRad(lighting.keyElevation)}
                      onChange={(e) => {
                        const deg = Number(e.target.value);
                        onUpdateLighting((prev) => ({ ...prev, keyElevation: radFromDegrees(deg) }));
                      }}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-[#282b32] rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5 bg-[#141518]/50 p-2 rounded-xl border border-[#2e323b]">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-300">Key Brightness</span>
                      <span className="text-neutral-400">{lighting.keyIntensity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={3.0}
                      step={0.1}
                      value={lighting.keyIntensity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateLighting((prev) => ({ ...prev, keyIntensity: val }));
                      }}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#282b32] rounded-lg"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-neutral-300 text-[10px]">Soft Floor Shadow</span>
                      <button
                        onClick={() =>
                          onUpdateLighting((prev) => ({
                            ...prev,
                            shadowsEnabled: !prev.shadowsEnabled,
                          }))
                        }
                        className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                          lighting.shadowsEnabled ? 'bg-blue-600' : 'bg-[#2c2f37]'
                        }`}
                      >
                        <div
                          className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                            lighting.shadowsEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
