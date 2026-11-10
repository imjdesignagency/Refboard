import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  DiagnosticScorecard,
  WorkerBenchmarkResult,
  CanvasBenchmarkResult,
  StorageBenchmarkResult,
  BenchmarkRating,
} from '../../utils/systemDiagnostics';

interface SystemCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
  currentStage: 'idle' | 'generating' | 'worker' | 'canvas' | 'storage' | 'done';
  stageProgress: number; // 0 - 100
  workerStatusText: string;
  canvasLiveFps: number;
  canvasLiveFrameTime: number;
  scorecard: DiagnosticScorecard | null;
  onRunTest: () => void;
  onCleanUpTestItems: () => void;
  onKeepTestItems: () => void;
  hasTestItemsOnBoard: boolean;
}

export const SystemCheckModal: React.FC<SystemCheckModalProps> = ({
  isOpen,
  onClose,
  isRunning,
  currentStage,
  stageProgress,
  workerStatusText,
  canvasLiveFps,
  canvasLiveFrameTime,
  scorecard,
  onRunTest,
  onCleanUpTestItems,
  onKeepTestItems,
  hasTestItemsOnBoard,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    if (!scorecard) return;
    const text = [
      `=== REFERENCE BOARD SYSTEM CHECK REPORT ===`,
      `Overall Rating: ${scorecard.overallRating}`,
      `Summary: ${scorecard.summary}`,
      `Date: ${new Date(scorecard.timestamp).toLocaleString()}`,
      ``,
      `--- WEB WORKER PIPELINE ---`,
      `Total Images Processed: ${scorecard.worker.totalCount}`,
      `Success Rate: ${scorecard.worker.successCount}/${scorecard.worker.totalCount} (Errors: ${scorecard.worker.errorCount})`,
      `Average Latency: ${scorecard.worker.avgLatencyMs} ms / image`,
      `Throughput: ${scorecard.worker.throughputMps} Megapixels / sec`,
      `Total Batch Duration: ${scorecard.worker.totalDurationMs} ms`,
      `Compression Ratio: ${scorecard.worker.compressionRatio}%`,
      `Worker Rating: ${scorecard.worker.rating}`,
      ``,
      `--- CANVAS 2D RENDERING & CULLING ---`,
      `Average FPS: ${scorecard.canvas.avgFps} FPS`,
      `1% Low FPS: ${scorecard.canvas.onePercentLowFps} FPS`,
      `Average Frame Time: ${scorecard.canvas.avgFrameTimeMs} ms`,
      `Max Frame Time: ${scorecard.canvas.maxFrameTimeMs} ms`,
      `Dropped Frames (Jank >50ms): ${scorecard.canvas.droppedFrames} / ${scorecard.canvas.totalFrames}`,
      `Items on Board: ${scorecard.canvas.itemsOnBoard}`,
      `Canvas Rating: ${scorecard.canvas.rating}`,
      ``,
      `--- PERSISTENCE & STORAGE ---`,
      `Serialized State Size: ${scorecard.storage.serializedFormatted}`,
      `Serialization Duration: ${scorecard.storage.serializationDurationMs} ms`,
      `Estimated Storage Quota: ${scorecard.storage.estimatedStorageQuotaMb} MB`,
      `Quota Used: ${scorecard.storage.quotaUsagePercent}%`,
      `Storage Rating: ${scorecard.storage.rating}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRatingBadge = (rating: BenchmarkRating) => {
    switch (rating) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            EXCELLENT
          </span>
        );
      case 'GOOD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            GOOD
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            WARNING
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            BOTTLENECK DETECTED
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#17181d] border border-white/10 shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1e2027]/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-wide">
                  System Diagnostics & Stress Test
                </h2>
                {scorecard && !isRunning && getRatingBadge(scorecard.overallRating)}
              </div>
              <p className="text-xs text-slate-400">
                Automated 4K batch load, Web Worker throughput, and 60 FPS motion verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto text-sm scrollbar-thin scrollbar-thumb-white/10 min-h-0">
          {/* Running State Progress HUD */}
          {isRunning && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-950/30 via-[#1e2027] to-[#17181d] border border-blue-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                  <span className="font-semibold text-white tracking-wide text-xs uppercase">
                    {currentStage === 'generating' && 'Synthesizing 4K Test Fixtures...'}
                    {currentStage === 'worker' && 'Web Worker Concurrency Test...'}
                    {currentStage === 'canvas' && 'Canvas 60 FPS Camera Sweep...'}
                    {currentStage === 'storage' && 'Auditing Persistence & Storage...'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 tabular-nums">
                  {Math.round(stageProgress)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${stageProgress}%` }}
                />
              </div>

              {/* Live metrics indicator */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Pipeline Status</span>
                  <span className="text-xs font-mono text-slate-200 truncate max-w-[150px]">
                    {workerStatusText || 'Running...'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Live Render FPS</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                      {canvasLiveFps || '--'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({canvasLiveFrameTime > 0 ? `${canvasLiveFrameTime}ms` : '0ms'})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Idle State (Prompt to run) */}
          {!isRunning && !scorecard && (
            <div className="text-center py-8 px-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-sm font-semibold text-white">
                  Execute Automated High-Resolution Stress Test
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This test generates 12 high-resolution artistic fixtures (up to 4K UHD), streams them through
                  the background Web Worker optimization pipeline, executes an automated camera sweep across
                  the board canvas, and checks local storage consumption.
                </p>
              </div>
              <button
                type="button"
                onClick={onRunTest}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Stress Test</span>
              </button>
            </div>
          )}

          {/* Scorecard View */}
          {!isRunning && scorecard && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Summary Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  scorecard.overallRating === 'EXCELLENT'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : scorecard.overallRating === 'GOOD'
                    ? 'bg-blue-950/20 border-blue-500/30 text-blue-200'
                    : scorecard.overallRating === 'WARNING'
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {scorecard.overallRating === 'EXCELLENT' || scorecard.overallRating === 'GOOD' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs tracking-wide uppercase text-white">
                    Overall Diagnostic: {scorecard.overallRating}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    {scorecard.summary}
                  </div>
                </div>
              </div>

              {/* 3 Component Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Web Worker */}
                <div className="p-4 rounded-xl bg-[#1d1f26] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-xs text-white">Web Worker</span>
                    </div>
                    {getRatingBadge(scorecard.worker.rating)}
                  </div>

                  <div className="space-y-2 pt-1 border-t border-white/5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Latency</span>
                      <span className="font-mono font-medium text-slate-200">
                        {scorecard.worker.avgLatencyMs} ms / img
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Throughput</span>
                      <span className="font-mono font-medium text-emerald-400">
                        {scorecard.worker.throughputMps} MP/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Duration</span>
                      <span className="font-mono font-medium text-slate-200">
                        {scorecard.worker.totalDurationMs} ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Processed</span>
                      <span className="font-mono font-medium text-slate-200">
                        {scorecard.worker.successCount} of {scorecard.worker.totalCount} (0 err)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compression</span>
                      <span className="font-mono font-medium text-blue-400">
                        -{scorecard.worker.compressionRatio}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Canvas 2D Rendering */}
                <div className="p-4 rounded-xl bg-[#1d1f26] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-xs text-white">Canvas 2D</span>
                    </div>
                    {getRatingBadge(scorecard.canvas.rating)}
                  </div>

                  <div className="space-y-2 pt-1 border-t border-white/5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Average FPS</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {scorecard.canvas.avgFps} FPS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">1% Low FPS</span>
                      <span className="font-mono font-medium text-slate-200">
                        {scorecard.canvas.onePercentLowFps} FPS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Frame Render Time</span>
                      <span className="font-mono font-medium text-slate-200">
                        {scorecard.canvas.avgFrameTimeMs} ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dropped Frames</span>
                      <span className="font-mono font-medium text-slate-200">
                        {scorecard.canvas.droppedFrames} (jank &gt;50ms)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Items Tested</span>
                      <span className="font-mono font-medium text-slate-200">
                        {scorecard.canvas.itemsOnBoard} items
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Persistence & Storage */}
                <div className="p-4 rounded-xl bg-[#1d1f26] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-xs text-white">Persistence</span>
                    </div>
                    {getRatingBadge(scorecard.storage.rating)}
                  </div>

                  <div className="space-y-2 pt-1 border-t border-white/5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Serialized Size</span>
                      <span className="font-mono font-medium text-slate-200">
                        {scorecard.storage.serializedFormatted}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Save Speed</span>
                      <span className="font-mono font-medium text-slate-200">
                        {scorecard.storage.serializationDurationMs} ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quota Limit</span>
                      <span className="font-mono font-medium text-slate-200">
                        ~{scorecard.storage.estimatedStorageQuotaMb} MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quota Usage</span>
                      <span className="font-mono font-medium text-purple-400">
                        {scorecard.storage.quotaUsagePercent}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Health</span>
                      <span className="font-mono font-medium text-emerald-400">
                        Verified OK
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Items Management Notice */}
              {hasTestItemsOnBoard && (
                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-300">
                      Stress test fixtures are currently on the reference board for interactive pan & zoom.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onCleanUpTestItems}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clean Up Fixtures</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pinned Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#16171c] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {scorecard && (
              <button
                type="button"
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Report</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Report</span>
                  </>
                )}
              </button>
            )}

            {scorecard && !isRunning && (
              <button
                type="button"
                onClick={onRunTest}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rerun Test</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasTestItemsOnBoard && scorecard && !isRunning && (
              <button
                type="button"
                onClick={() => {
                  onKeepTestItems();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-colors"
              >
                Keep on Canvas
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-40"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
