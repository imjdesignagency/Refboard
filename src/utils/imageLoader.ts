const imageCache = new Map<string, HTMLImageElement>();
const mipmapCache = new Map<string, HTMLCanvasElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();
const failedSources = new Set<string>();

export type DrawableImage = HTMLImageElement | HTMLCanvasElement;

function createMipmap(img: HTMLImageElement): HTMLCanvasElement | null {
  try {
    const maxDim = 640;
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (longest <= maxDim) return null;

    const scale = maxDim / longest;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  } catch {
    return null;
  }
}

export function getImage(src: string): HTMLImageElement | null {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }
  return null;
}

/**
 * Returns a display-ready image: returns the lightweight 640px mipmap when targetWidth <= 640,
 * and the crisp full-resolution image when targetWidth > 640 or during close-up inspection.
 */
export function getDisplayImage(src: string, targetWidth: number): DrawableImage | null {
  if (targetWidth <= 640) {
    const mip = mipmapCache.get(src);
    if (mip) return mip;
  }
  return getImage(src);
}

export function setCachedImage(src: string, img: HTMLImageElement): void {
  if (img && img.naturalWidth > 0) {
    imageCache.set(src, img);
    failedSources.delete(src);
    const mip = createMipmap(img);
    if (mip) mipmapCache.set(src, mip);
  }
}

export function isImageFailed(src: string): boolean {
  return failedSources.has(src);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  if (failedSources.has(src)) {
    return Promise.reject(new Error(`Image previously failed to load: ${src}`));
  }

  if (loadingPromises.has(src)) {
    return loadingPromises.get(src)!;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // NEVER set crossOrigin on blob: or data: URLs as it causes Chromium CORS failures
    if (!src.startsWith('blob:') && !src.startsWith('data:') && !src.startsWith('/')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      imageCache.set(src, img);
      loadingPromises.delete(src);
      failedSources.delete(src);
      const mip = createMipmap(img);
      if (mip) mipmapCache.set(src, mip);
      resolve(img);
    };

    img.onerror = (err) => {
      loadingPromises.delete(src);
      failedSources.add(src);
      reject(err);
    };

    img.src = src;
  });

  loadingPromises.set(src, promise);
  return promise;
}

export async function preloadImages(srcList: string[]): Promise<void> {
  const uncached = srcList.filter((src) => !imageCache.has(src) && !failedSources.has(src));
  if (uncached.length === 0) return;
  await Promise.all(uncached.map((src) => loadImage(src).catch(() => null)));
}
