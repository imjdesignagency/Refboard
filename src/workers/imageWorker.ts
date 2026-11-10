/**
 * Dedicated Background Web Worker for image decoding and downscaling.
 * Runs completely off the main JavaScript UI thread so UI animations,
 * 60fps pan/zoom, and user interactions never stutter or freeze.
 */

export interface WorkerProcessRequest {
  id: string;
  file: File;
  maxDimension: number;
}

export interface WorkerProcessResponse {
  id: string;
  success: boolean;
  blob?: Blob;
  naturalWidth?: number;
  naturalHeight?: number;
  fileSize?: number;
  isOptimized?: boolean;
  error?: string;
}

self.onmessage = async (e: MessageEvent<WorkerProcessRequest>) => {
  const { id, file, maxDimension } = e.data;

  try {
    let naturalWidth = 0;
    let naturalHeight = 0;
    let bitmap: ImageBitmap | null = null;

    // Decode image off the main thread
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file);
      naturalWidth = bitmap.width;
      naturalHeight = bitmap.height;
    } else {
      throw new Error('createImageBitmap not available in Worker');
    }

    const longestEdge = Math.max(naturalWidth, naturalHeight);

    // If already within working dimension, return original file blob
    if (longestEdge <= maxDimension) {
      bitmap.close();
      const res: WorkerProcessResponse = {
        id,
        success: true,
        blob: file,
        naturalWidth,
        naturalHeight,
        fileSize: file.size,
        isOptimized: false,
      };
      self.postMessage(res);
      return;
    }

    // Downscale proportionally using OffscreenCanvas in the worker thread
    const scale = maxDimension / longestEdge;
    const scaledWidth = Math.round(naturalWidth * scale);
    const scaledHeight = Math.round(naturalHeight * scale);

    if (typeof OffscreenCanvas === 'undefined') {
      // If OffscreenCanvas not in this worker environment, return original
      bitmap.close();
      const res: WorkerProcessResponse = {
        id,
        success: true,
        blob: file,
        naturalWidth,
        naturalHeight,
        fileSize: file.size,
        isOptimized: false,
      };
      self.postMessage(res);
      return;
    }

    const offscreen = new OffscreenCanvas(scaledWidth, scaledHeight);
    const ctx = offscreen.getContext('2d');

    if (!ctx) {
      bitmap.close();
      throw new Error('Could not get 2D context from OffscreenCanvas');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(bitmap, 0, 0, scaledWidth, scaledHeight);
    bitmap.close();

    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const quality = 0.82;

    const optimizedBlob = await offscreen.convertToBlob({
      type: mimeType,
      quality,
    });

    const res: WorkerProcessResponse = {
      id,
      success: true,
      blob: optimizedBlob,
      naturalWidth: scaledWidth,
      naturalHeight: scaledHeight,
      fileSize: optimizedBlob.size,
      isOptimized: true,
    };
    self.postMessage(res);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const res: WorkerProcessResponse = {
      id,
      success: false,
      error: errorMsg,
    };
    self.postMessage(res);
  }
};
