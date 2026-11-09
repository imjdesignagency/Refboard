import { ReferenceItem, ViewportTransform } from '../types/canvas';
import { getImage, loadImage } from './imageLoader';
import { getItemCenter } from './math';
import { drawReferenceGrid } from './gridRenderer';

export interface ExportOptions {
  mode: 'entire-board' | 'viewport';
  transparentBg: boolean;
  scaleFactor: number; // 1x or 2x for retina quality
}

export async function exportBoardToPNG(
  items: ReferenceItem[],
  transform: ViewportTransform,
  options: ExportOptions
): Promise<void> {
  const visibleItems = items.filter((it) => it.isVisible !== false);

  let exportX = 0;
  let exportY = 0;
  let exportW = 1920;
  let exportH = 1080;

  if (options.mode === 'viewport') {
    exportX = -transform.x / transform.scale;
    exportY = -transform.y / transform.scale;
    exportW = window.innerWidth / transform.scale;
    exportH = window.innerHeight / transform.scale;
  } else {
    // Entire board
    if (visibleItems.length === 0) {
      exportX = -500;
      exportY = -500;
      exportW = 1000;
      exportH = 1000;
    } else {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      visibleItems.forEach((it) => {
        minX = Math.min(minX, it.x);
        minY = Math.min(minY, it.y);
        maxX = Math.max(maxX, it.x + it.width);
        maxY = Math.max(maxY, it.y + it.height);
      });

      const pad = 80;
      exportX = minX - pad;
      exportY = minY - pad;
      exportW = maxX - minX + pad * 2;
      exportH = maxY - minY + pad * 2;
    }
  }

  const dpr = options.scaleFactor || 2;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = Math.max(100, Math.round(exportW * dpr));
  offCanvas.height = Math.max(100, Math.round(exportH * dpr));

  const ctx = offCanvas.getContext('2d');
  if (!ctx) return;

  // Background
  if (!options.transparentBg) {
    ctx.fillStyle = '#141518';
    ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
  }

  // Pre-load all images
  const imageItems = visibleItems.filter((it) => it.type === 'image' && it.src);
  await Promise.all(imageItems.map((it) => loadImage(it.src!).catch(() => null)));

  // Setup transform
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(-exportX, -exportY);

  // Sort by zIndex
  const sorted = [...visibleItems].sort((a, b) => a.zIndex - b.zIndex);

  for (const item of sorted) {
    ctx.save();
    ctx.globalAlpha = item.opacity;

    if (item.type === 'image' && item.src) {
      const img = getImage(item.src);
      const center = getItemCenter(item);

      ctx.translate(center.x, center.y);
      ctx.rotate(item.rotation);

      if (item.isFlippedH || item.isFlippedV) {
        ctx.scale(item.isFlippedH ? -1 : 1, item.isFlippedV ? -1 : 1);
      }

      if (img) {
        if (item.crop) {
          // Cropped sub-rectangle
          const sx = item.crop.x * img.naturalWidth;
          const sy = item.crop.y * img.naturalHeight;
          const sw = item.crop.width * img.naturalWidth;
          const sh = item.crop.height * img.naturalHeight;
          ctx.drawImage(img, sx, sy, sw, sh, -item.width / 2, -item.height / 2, item.width, item.height);
        } else {
          ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
        }

        // Draw reference grid overlay if enabled
        if (item.gridOverlay?.enabled) {
          drawReferenceGrid(
            ctx,
            item.gridOverlay,
            item.width,
            item.height,
            1,
            item.isFlippedH,
            item.isFlippedV
          );
        }
      }
    } else if (item.type === 'stroke' && item.points && item.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(item.points[0].x, item.points[0].y);
      for (let i = 1; i < item.points.length; i++) {
        ctx.lineTo(item.points[i].x, item.points[i].y);
      }
      ctx.strokeStyle = item.strokeColor || '#3b82f6';
      ctx.lineWidth = item.strokeWidth || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else if (item.type === 'text') {
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      ctx.fillStyle = item.fontColor || '#ffffff';
      ctx.font = `${item.fontSize || 20}px system-ui, sans-serif`;
      ctx.fillText(item.text || '', 0, item.fontSize || 20);
    } else if (item.type === 'shape') {
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      ctx.strokeStyle = item.shapeColor || '#3b82f6';
      ctx.lineWidth = 3;
      if (item.shapeType === 'circle') {
        ctx.beginPath();
        ctx.ellipse(item.width / 2, item.height / 2, item.width / 2, item.height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(0, 0, item.width, item.height);
      }
    }

    ctx.restore();
  }

  ctx.restore();

  // Export to downloadable blob
  offCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `REFBOARD-${options.mode}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
