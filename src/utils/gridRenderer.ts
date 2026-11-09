import { ReferenceGridConfig } from '../types/canvas';

/**
 * Draws an artist reference grid overlay directly onto an image's local coordinate space.
 * The coordinate origin (0, 0) is assumed to be the center of the image.
 *
 * @param ctx The 2D rendering context (already positioned at the image center and rotated)
 * @param grid The reference grid configuration
 * @param width The width of the reference image in the current context pixels
 * @param height The height of the reference image in the current context pixels
 * @param zoomScale Viewport scale factor (used to maintain legible badge sizes)
 * @param isFlippedH Whether the parent context is horizontally flipped
 * @param isFlippedV Whether the parent context is vertically flipped
 */
export function drawReferenceGrid(
  ctx: CanvasRenderingContext2D,
  grid: ReferenceGridConfig,
  width: number,
  height: number,
  zoomScale = 1,
  isFlippedH = false,
  isFlippedV = false
): void {
  if (!grid.enabled) return;

  const rows = Math.max(1, Math.min(64, Math.round(grid.rows || 4)));
  const cols = Math.max(1, Math.min(64, Math.round(grid.columns || 4)));
  const color = grid.color || '#38bdf8';
  const opacity = Math.max(0.1, Math.min(1, grid.opacity ?? 0.85));
  const lineWidth = Math.max(0.75, grid.lineWidth ?? 1.5);

  const x0 = -width / 2;
  const y0 = -height / 2;
  const colW = width / cols;
  const rowH = height / rows;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'butt';

  // 1. Outer perimeter border
  ctx.strokeRect(x0, y0, width, height);

  // 2. Interior vertical grid lines
  ctx.beginPath();
  for (let c = 1; c < cols; c++) {
    const x = x0 + c * colW;
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y0 + height);
  }

  // 3. Interior horizontal grid lines
  for (let r = 1; r < rows; r++) {
    const y = y0 + r * rowH;
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + width, y);
  }
  ctx.stroke();

  // 4. Coordinates / Numbering for columns (top) and rows (left)
  if (grid.showNumbering) {
    const minCellDim = Math.min(colW, rowH);
    // Base font size scaled with cell dimension and clamped for readability
    const fontSize = Math.max(9, Math.min(18, Math.round(minCellDim * 0.22)));
    const badgePad = Math.max(2, Math.round(fontSize * 0.25));
    const badgeHeight = fontSize + badgePad * 2;

    ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Helper to draw a rounded badge
    const drawBadge = (
      text: string,
      centerX: number,
      centerY: number
    ) => {
      const textMetrics = ctx.measureText(text);
      const badgeW = Math.max(badgeHeight, Math.round(textMetrics.width + badgePad * 2.5));

      ctx.save();
      ctx.translate(centerX, centerY);

      // If the parent context was flipped, un-flip the text so numbers stay upright
      if (isFlippedH || isFlippedV) {
        ctx.scale(isFlippedH ? -1 : 1, isFlippedV ? -1 : 1);
      }

      // High-contrast pill background
      ctx.fillStyle = 'rgba(15, 17, 23, 0.88)';
      const radius = Math.min(4, badgeHeight / 2);

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-badgeW / 2, -badgeHeight / 2, badgeW, badgeHeight, radius);
      } else {
        ctx.rect(-badgeW / 2, -badgeHeight / 2, badgeW, badgeHeight);
      }
      ctx.fill();

      // Border in the grid theme color
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text label
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 0, 0.5);

      ctx.restore();
    };

    // Top column numbers (1, 2, 3... columns)
    for (let c = 0; c < cols; c++) {
      const colNum = String(c + 1);
      const cellCenterX = x0 + c * colW + colW / 2;
      const badgeY = y0 + badgeHeight / 2 + 2;
      drawBadge(colNum, cellCenterX, badgeY);
    }

    // Left row numbers (1, 2, 3... rows)
    for (let r = 0; r < rows; r++) {
      const rowNum = String(r + 1);
      const cellCenterY = y0 + r * rowH + rowH / 2;
      const textMetrics = ctx.measureText(rowNum);
      const badgeW = Math.max(badgeHeight, Math.round(textMetrics.width + badgePad * 2.5));
      const badgeX = x0 + badgeW / 2 + 2;
      drawBadge(rowNum, badgeX, cellCenterY);
    }
  }

  ctx.restore();
}
