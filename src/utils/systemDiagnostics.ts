import { ReferenceItem } from '../types/canvas';
import { optimizeImageFile, OptimizedImageResult } from './imageOptimizer';

export type BenchmarkRating = 'EXCELLENT' | 'GOOD' | 'WARNING' | 'FAIL';

export interface WorkerBenchmarkResult {
  totalCount: number;
  successCount: number;
  errorCount: number;
  totalDurationMs: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  totalOriginalBytes: number;
  totalOptimizedBytes: number;
  throughputMps: number; // Megapixels processed per second
  optimizedCount: number;
  compressionRatio: number;
  rating: BenchmarkRating;
  results: OptimizedImageResult[];
}

export interface CanvasBenchmarkResult {
  avgFps: number;
  onePercentLowFps: number;
  totalFrames: number;
  droppedFrames: number; // frames taking > 33.3ms (< 30fps)
  avgFrameTimeMs: number;
  maxFrameTimeMs: number;
  durationMs: number;
  itemsOnBoard: number;
  rating: BenchmarkRating;
}

export interface StorageBenchmarkResult {
  serializedBytes: number;
  serializedFormatted: string;
  itemCount: number;
  serializationDurationMs: number;
  estimatedStorageUsedMb: number;
  estimatedStorageQuotaMb: number;
  quotaUsagePercent: number;
  rating: BenchmarkRating;
}

export interface DiagnosticScorecard {
  timestamp: number;
  worker: WorkerBenchmarkResult;
  canvas: CanvasBenchmarkResult;
  storage: StorageBenchmarkResult;
  overallRating: BenchmarkRating;
  summary: string;
}

// Preset resolutions for high-resolution test fixtures
const TEST_RESOLUTIONS = [
  { width: 3840, height: 2160, label: '4K UHD' },
  { width: 2560, height: 1440, label: 'QHD 1440p' },
  { width: 2048, height: 2048, label: '2K Square' },
  { width: 1920, height: 1080, label: 'Full HD' },
  { width: 3200, height: 1800, label: '3.2K Wide' },
  { width: 2400, height: 3000, label: '3K Portrait' },
];

const PALETTES = [
  ['#1e3a8a', '#3b82f6', '#93c5fd', '#f43f5e'],
  ['#064e3b', '#10b981', '#6ee7b7', '#f59e0b'],
  ['#581c87', '#a855f7', '#d8b4fe', '#ec4899'],
  ['#7c2d12', '#ea580c', '#fdba74', '#06b6d4'],
  ['#111827', '#374151', '#9ca3af', '#6366f1'],
];

/**
 * Synthesizes a high-resolution artistic test image directly in memory.
 * Emulates complex artist reference photos with gradients, anatomy lines, and textures.
 */
export async function generateSyntheticHighResImage(
  index: number,
  resolutionIndex = 0
): Promise<File> {
  const res = TEST_RESOLUTIONS[resolutionIndex % TEST_RESOLUTIONS.length];
  const { width, height, label } = res;
  const palette = PALETTES[index % PALETTES.length];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Could not create 2D canvas context for synthetic image');
  }

  // 1. Rich background radial gradient
  const grad = ctx.createRadialGradient(
    width * 0.4,
    height * 0.35,
    width * 0.05,
    width * 0.5,
    height * 0.5,
    width * 0.75
  );
  grad.addColorStop(0, palette[1]);
  grad.addColorStop(0.5, palette[0]);
  grad.addColorStop(1, '#0c0d12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. High-frequency grid overlay
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = Math.max(1, Math.round(width / 1920));
  const step = Math.round(width / 24);
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Artistic anatomical / geometry curves
  ctx.strokeStyle = palette[2];
  ctx.lineWidth = Math.max(3, Math.round(width / 600));
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const startY = height * (0.2 + i * 0.18);
    ctx.moveTo(0, startY);
    ctx.bezierCurveTo(
      width * 0.3,
      startY - height * 0.2,
      width * 0.7,
      startY + height * 0.2,
      width,
      startY
    );
    ctx.stroke();
  }

  // 4. Stylized circular lens / color wheel target
  const cx = width * 0.75;
  const cy = height * 0.65;
  const r = Math.min(width, height) * 0.22;
  for (let arc = 0; arc < 8; arc++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, (arc * Math.PI) / 4, ((arc + 1) * Math.PI) / 4);
    ctx.fillStyle = arc % 2 === 0 ? palette[3] : 'rgba(255,255,255,0.15)';
    ctx.fill();
  }

  // 5. High-resolution reference metadata banner
  const bannerH = Math.max(70, Math.round(height * 0.08));
  ctx.fillStyle = 'rgba(10, 11, 15, 0.88)';
  ctx.fillRect(0, height - bannerH, width, bannerH);

  ctx.fillStyle = '#ffffff';
  const fontSize = Math.max(22, Math.round(bannerH * 0.4));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText(
    `BENCHMARK FIXTURE #${index + 1} — ${label} (${width}×${height})`,
    Math.round(width * 0.03),
    height - bannerH / 2 + fontSize * 0.35
  );

  ctx.fillStyle = palette[2];
  ctx.font = `500 ${Math.round(fontSize * 0.8)}px monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(
    `STRESS-TEST-${Date.now().toString(36).toUpperCase()}`,
    width - Math.round(width * 0.03),
    height - bannerH / 2 + fontSize * 0.35
  );
  ctx.textAlign = 'left';

  // Convert to high-res JPEG blob
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate synthetic image blob'));
          return;
        }
        const fileName = `stress-ref-${String(index + 1).padStart(2, '0')}-${width}x${height}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        resolve(file);
      },
      'image/jpeg',
      0.85
    );
  });
}

/**
 * Stage 1: Web Worker stress test
 * Pushes multiple high-res fixtures through the worker pipeline and measures processing throughput.
 */
export async function runWorkerStressTest(
  fileCount = 12,
  onProgress?: (
    completed: number,
    total: number,
    current: { name: string; latencyMs: number; isOptimized: boolean }
  ) => void
): Promise<WorkerBenchmarkResult> {
  const files: File[] = [];

  // Generate synthetic test files
  for (let i = 0; i < fileCount; i++) {
    const file = await generateSyntheticHighResImage(i, i);
    files.push(file);
  }

  const results: OptimizedImageResult[] = [];
  const latencies: number[] = [];
  let totalOriginalBytes = 0;
  let totalOptimizedBytes = 0;
  let totalPixels = 0;
  let errorCount = 0;
  let optimizedCount = 0;

  const startTime = performance.now();

  // Run in worker batches with concurrency 3
  const CONCURRENCY = 3;
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const chunk = files.slice(i, i + CONCURRENCY);
    const chunkPromises = chunk.map(async (file, subIdx) => {
      const idx = i + subIdx;
      totalOriginalBytes += file.size;

      const imgStart = performance.now();
      try {
        const res = await optimizeImageFile(file, idx, 2048);
        const latency = Math.round(performance.now() - imgStart);
        latencies.push(latency);
        totalOptimizedBytes += res.fileSize;
        totalPixels += res.naturalWidth * res.naturalHeight;
        if (res.isOptimized) optimizedCount++;

        onProgress?.(results.length + 1, fileCount, {
          name: file.name,
          latencyMs: latency,
          isOptimized: res.isOptimized,
        });

        return res;
      } catch (err) {
        errorCount++;
        console.warn('Worker benchmark item failed:', file.name, err);
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    for (const r of chunkResults) {
      if (r) results.push(r);
    }
  }

  const totalDurationMs = Math.round(performance.now() - startTime);
  const avgLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
  const minLatencyMs = latencies.length > 0 ? Math.min(...latencies) : 0;
  const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : 0;
  const totalDurationSec = Math.max(0.001, totalDurationMs / 1000);
  const throughputMps = Number((totalPixels / 1_000_000 / totalDurationSec).toFixed(2));
  const compressionRatio =
    totalOriginalBytes > 0
      ? Number(((1 - totalOptimizedBytes / totalOriginalBytes) * 100).toFixed(1))
      : 0;

  // Rate Web Worker performance
  let rating: BenchmarkRating = 'EXCELLENT';
  if (errorCount > 0 || avgLatencyMs > 450) {
    rating = 'FAIL';
  } else if (avgLatencyMs > 280) {
    rating = 'WARNING';
  } else if (avgLatencyMs > 160) {
    rating = 'GOOD';
  }

  return {
    totalCount: fileCount,
    successCount: results.length,
    errorCount,
    totalDurationMs,
    avgLatencyMs,
    minLatencyMs,
    maxLatencyMs,
    totalOriginalBytes,
    totalOptimizedBytes,
    throughputMps,
    optimizedCount,
    compressionRatio,
    results,
    rating,
  };
}

/**
 * Stage 2: Canvas Camera Sweep & Frame Rate Benchmark
 * Runs a 2.5-second automated pan & zoom motion sequence while measuring frame duration and culling.
 */
export async function runCanvasBenchmark(
  itemCount: number,
  runCameraSweep: (
    onFrame: (instantFps: number, frameTimeMs: number, culledCount: number) => void
  ) => Promise<{
    avgFps: number;
    onePercentLowFps: number;
    totalFrames: number;
    droppedFrames: number;
    avgFrameTimeMs: number;
    maxFrameTimeMs: number;
    durationMs: number;
  }>
): Promise<CanvasBenchmarkResult> {
  const stats = await runCameraSweep(() => {});

  let rating: BenchmarkRating = 'EXCELLENT';
  if (stats.avgFps < 20 || stats.droppedFrames > 4) {
    rating = 'FAIL';
  } else if (stats.droppedFrames > 1 || (stats.avgFps < 26 && stats.droppedFrames > 0)) {
    rating = 'WARNING';
  } else if (stats.avgFps >= 50 || (stats.avgFps >= 26 && stats.droppedFrames === 0)) {
    rating = 'EXCELLENT';
  } else {
    rating = 'GOOD';
  }

  return {
    avgFps: stats.avgFps,
    onePercentLowFps: stats.onePercentLowFps,
    totalFrames: stats.totalFrames,
    droppedFrames: stats.droppedFrames,
    avgFrameTimeMs: stats.avgFrameTimeMs,
    maxFrameTimeMs: stats.maxFrameTimeMs,
    durationMs: stats.durationMs,
    itemsOnBoard: itemCount,
    rating,
  };
}

/**
 * Stage 3: Storage & Persistence Audit
 * Measures serialized state size and checks storage limits.
 */
export async function runStorageAudit(items: ReferenceItem[]): Promise<StorageBenchmarkResult> {
  const start = performance.now();
  const serialized = JSON.stringify(items);
  const serializationDurationMs = Number((performance.now() - start).toFixed(2));
  const serializedBytes = new Blob([serialized]).size;

  let serializedFormatted = `${(serializedBytes / 1024).toFixed(1)} KB`;
  if (serializedBytes >= 1024 * 1024) {
    serializedFormatted = `${(serializedBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Storage estimate
  let estimatedStorageUsedMb = Number((serializedBytes / (1024 * 1024)).toFixed(3));
  let estimatedStorageQuotaMb = 50; // standard fallback
  let quotaUsagePercent = 0.5;

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      if (est.quota) {
        estimatedStorageQuotaMb = Math.round(est.quota / (1024 * 1024));
      }
      if (est.usage) {
        estimatedStorageUsedMb = Number((est.usage / (1024 * 1024)).toFixed(2));
      }
      if (est.quota && est.usage) {
        quotaUsagePercent = Number(((est.usage / est.quota) * 100).toFixed(2));
      }
    } catch {
      // Use defaults
    }
  }

  let rating: BenchmarkRating = 'EXCELLENT';
  if (serializedBytes > 5 * 1024 * 1024 || serializationDurationMs > 60) {
    rating = 'FAIL';
  } else if (serializedBytes > 2 * 1024 * 1024 || serializationDurationMs > 25) {
    rating = 'WARNING';
  } else if (serializedBytes > 500 * 1024) {
    rating = 'GOOD';
  }

  return {
    serializedBytes,
    serializedFormatted,
    itemCount: items.length,
    serializationDurationMs,
    estimatedStorageUsedMb,
    estimatedStorageQuotaMb,
    quotaUsagePercent,
    rating,
  };
}

/**
 * Calculates overall scorecard rating
 */
export function calculateOverallRating(
  worker: WorkerBenchmarkResult,
  canvas: CanvasBenchmarkResult,
  storage: StorageBenchmarkResult
): { rating: BenchmarkRating; summary: string } {
  const ratings = [worker.rating, canvas.rating, storage.rating];

  if (ratings.includes('FAIL')) {
    return {
      rating: 'FAIL',
      summary: 'Performance bottlenecks detected in one or more systems under stress load.',
    };
  }
  if (ratings.includes('WARNING')) {
    return {
      rating: 'WARNING',
      summary: 'Acceptable performance with minor frame drops or latency spikes under high load.',
    };
  }
  if (ratings.includes('GOOD')) {
    return {
      rating: 'GOOD',
      summary: 'Smooth performance across background threads and canvas rendering.',
    };
  }
  return {
    rating: 'EXCELLENT',
    summary: 'Optimal 60 FPS canvas motion, fast Web Worker throughput, and lightweight storage.',
  };
}
