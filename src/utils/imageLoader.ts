const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

export function getImage(src: string): HTMLImageElement | null {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }
  return null;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  if (loadingPromises.has(src)) {
    return loadingPromises.get(src)!;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      loadingPromises.delete(src);
      resolve(img);
    };
    img.onerror = (err) => {
      loadingPromises.delete(src);
      reject(err);
    };
    img.src = src;
  });

  loadingPromises.set(src, promise);
  return promise;
}

export async function preloadImages(srcList: string[]): Promise<void> {
  await Promise.all(srcList.map((src) => loadImage(src).catch(() => null)));
}
