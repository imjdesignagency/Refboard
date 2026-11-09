import { SnapshotExportOptions } from '../components/Modals/Export3DSnapshotModal';

/**
 * Composites 3D WebGL snapshot with customizable options (transparent background, lighting compass stamp, camera badge)
 */
export async function generate3DSnapshotDataUrl(
  glCanvas: HTMLCanvasElement,
  poseName: string,
  keyAngleRad: number,
  options: SnapshotExportOptions
): Promise<string> {
  const width = glCanvas.width * options.scaleFactor;
  const height = glCanvas.height * options.scaleFactor;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;

  const ctx = offscreen.getContext('2d');
  if (!ctx) return glCanvas.toDataURL('image/png');

  // 1. Draw base WebGL image
  ctx.drawImage(glCanvas, 0, 0, width, height);

  // 2. If transparent background requested, filter dark background pixels
  if (options.transparentBackground) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    // Dark background threshold filter (#141518 ~ RGB 20, 21, 24)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < 25 && g < 26 && b < 30) {
        data[i + 3] = 0; // Set alpha transparent
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // 3. Optional Camera & Pose Badge Stamp
  if (options.includeAngleBadge) {
    const pad = 16 * options.scaleFactor;
    const fontSize = 12 * options.scaleFactor;
    ctx.font = `600 ${fontSize}px sans-serif`;

    const text = `3D Reference: ${poseName}`;
    const textMetrics = ctx.measureText(text);
    const badgeW = textMetrics.width + 24 * options.scaleFactor;
    const badgeH = 28 * options.scaleFactor;

    ctx.fillStyle = 'rgba(20, 21, 24, 0.75)';
    ctx.beginPath();
    ctx.roundRect(pad, pad, badgeW, badgeH, 6 * options.scaleFactor);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(text, pad + 12 * options.scaleFactor, pad + 18 * options.scaleFactor);
  }

  // 4. Optional Lighting Direction Compass Stamp
  if (options.includeLightingCompass) {
    const size = 36 * options.scaleFactor;
    const cx = width - size - 20 * options.scaleFactor;
    const cy = size + 20 * options.scaleFactor;

    // Background circle
    ctx.fillStyle = 'rgba(20, 21, 24, 0.75)';
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Compass ring
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2 * options.scaleFactor;
    ctx.stroke();

    // Key light direction arrow
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(keyAngleRad);

    ctx.strokeStyle = '#fbbf24';
    ctx.fillStyle = '#fbbf24';
    ctx.lineWidth = 2.5 * options.scaleFactor;

    ctx.beginPath();
    ctx.moveTo(0, -(size / 2 - 6 * options.scaleFactor));
    ctx.lineTo(0, size / 2 - 8 * options.scaleFactor);
    ctx.stroke();

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(0, -(size / 2 - 4 * options.scaleFactor));
    ctx.lineTo(-4 * options.scaleFactor, -(size / 2 - 12 * options.scaleFactor));
    ctx.lineTo(4 * options.scaleFactor, -(size / 2 - 12 * options.scaleFactor));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  return offscreen.toDataURL('image/png');
}
