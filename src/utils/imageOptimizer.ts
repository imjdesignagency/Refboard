import { setCachedImage } from './imageLoader';
import { WorkerProcessRequest, WorkerProcessResponse } from '../workers/imageWorker';

export interface OptimizedImageResult {
  id: string;
  name: string;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: number;
  fileSize: number;
  isOptimized: boolean;
}

const MAX_WORKING_DIMENSION = 2048; // Crisp 2K resolution for artist references without GPU bloat
const DEFAULT_CANVAS_WIDTH = 420;   // Default placed width on the infinite board

// Singleton worker instance for background processing
let imageWorker: Worker | null = null;
const pendingWorkerRequests = new Map<
  string,
  {
    resolve: (res: WorkerProcessResponse) => void;
    reject: (err: Error) => void;
  }
>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!imageWorker) {
    try {
      imageWorker = new Worker(new URL('../workers/imageWorker.ts', import.meta.url), {
        type: 'module',
      });
      imageWorker.onmessage = (e: MessageEvent<WorkerProcessResponse>) => {
        const { id } = e.data;
        const pending = pendingWorkerRequests.get(id);
        if (pending) {
          pendingWorkerRequests.delete(id);
          if (e.data.success) {
            pending.resolve(e.data);
          } else {
            pending.reject(new Error(e.data.error || 'Worker failed to process image'));
          }
        }
      };
      imageWorker.onerror = (err) => {
        console.warn('Image worker encountered an error, fallback will be used:', err);
      };
    } catch (err) {
      console.warn('Could not instantiate image Web Worker:', err);
      imageWorker = null;
    }
  }
  return imageWorker;
}

/**
 * Optimizes an uploaded or dropped image file.
 * Offloads heavy decoding and resizing to a background Web Worker.
 * Awaits image decoding before caching so canvas rendering has 0 cache misses or redraw storms.
 */
export async function optimizeImageFile(
  file: File,
  index = 0,
  maxDimension = MAX_WORKING_DIMENSION
): Promise<OptimizedImageResult> {
  const cleanName = file.name.replace(/\.[^/.]+$/, '');
  const id = `imported-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;

  let resultBlob: Blob = file;
  let naturalWidth = 800;
  let naturalHeight = 600;
  let isOptimized = false;

  const worker = getWorker();

  if (worker) {
    try {
      const response = await new Promise<WorkerProcessResponse>((resolve, reject) => {
        pendingWorkerRequests.set(id, { resolve, reject });
        const request: WorkerProcessRequest = { id, file, maxDimension };
        worker.postMessage(request);
      });

      if (response.blob) resultBlob = response.blob;
      if (response.naturalWidth) naturalWidth = response.naturalWidth;
      if (response.naturalHeight) naturalHeight = response.naturalHeight;
      isOptimized = !!response.isOptimized;
    } catch {
      // Worker failed, perform safe fallback
      resultBlob = file;
    }
  } else {
    // Fallback if workers unavailable: decode metadata via createImageBitmap
    try {
      if (typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(file);
        naturalWidth = bitmap.width;
        naturalHeight = bitmap.height;
        bitmap.close();
      }
    } catch {
      // Keep defaults
    }
  }

  const aspectRatio = naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : 1;
  const targetCanvasW = Math.min(DEFAULT_CANVAS_WIDTH, naturalWidth || DEFAULT_CANVAS_WIDTH);
  const targetCanvasH = Math.round(targetCanvasW / aspectRatio);

  const objectUrl = URL.createObjectURL(resultBlob);

  // Pre-warm the cache immediately so canvas render has 0 cache misses
  const cachedImg = new Image();
  cachedImg.src = objectUrl;
  setCachedImage(objectUrl, cachedImg);

  // Trigger non-blocking background decode to populate mipmaps without blocking worker latency
  if (typeof cachedImg.decode === 'function') {
    cachedImg
      .decode()
      .then(() => setCachedImage(objectUrl, cachedImg))
      .catch(() => {});
  } else {
    cachedImg.onload = () => setCachedImage(objectUrl, cachedImg);
  }

  return {
    id,
    name: cleanName,
    src: objectUrl,
    naturalWidth,
    naturalHeight,
    canvasWidth: targetCanvasW,
    canvasHeight: targetCanvasH,
    aspectRatio,
    fileSize: resultBlob.size,
    isOptimized,
  };
}
