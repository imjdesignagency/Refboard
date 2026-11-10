export interface GridItemDimension {
  width: number;
  height: number;
}

export interface GridPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates a neat grid spread for a collection of imported reference images,
 * perfectly centered at the given viewport coordinates.
 *
 * @param dimensions Dimensions of each image to place
 * @param center Coordinates in world space where the batch should be centered
 * @param gap Horizontal and vertical spacing between images (default: 40px)
 */
export function calculateGridSpread(
  dimensions: GridItemDimension[],
  center: { x: number; y: number },
  gap = 40
): GridPlacement[] {
  const count = dimensions.length;
  if (count === 0) return [];

  if (count === 1) {
    const dim = dimensions[0];
    return [
      {
        x: center.x - dim.width / 2,
        y: center.y - dim.height / 2,
        width: dim.width,
        height: dim.height,
      },
    ];
  }

  // Determine ideal number of columns based on aspect and item count
  let cols = 2;
  if (count === 2) cols = 2;
  else if (count <= 4) cols = 2;
  else if (count <= 9) cols = 3;
  else if (count <= 16) cols = 4;
  else if (count <= 25) cols = 5;
  else cols = 6;

  // Group items into rows
  interface RowData {
    indices: number[];
    maxHeight: number;
    totalWidth: number;
  }

  const rows: RowData[] = [];
  let currentRow: RowData = { indices: [], maxHeight: 0, totalWidth: 0 };

  dimensions.forEach((dim, idx) => {
    currentRow.indices.push(idx);
    currentRow.maxHeight = Math.max(currentRow.maxHeight, dim.height);
    currentRow.totalWidth += dim.width;

    if (currentRow.indices.length === cols || idx === count - 1) {
      // Add gap widths
      currentRow.totalWidth += (currentRow.indices.length - 1) * gap;
      rows.push(currentRow);
      currentRow = { indices: [], maxHeight: 0, totalWidth: 0 };
    }
  });

  // Calculate total grid bounding box
  const gridWidth = Math.max(...rows.map((r) => r.totalWidth));
  const gridHeight =
    rows.reduce((sum, r) => sum + r.maxHeight, 0) + (rows.length - 1) * gap;

  const startX = center.x - gridWidth / 2;
  const startY = center.y - gridHeight / 2;

  const placements: GridPlacement[] = new Array(count);
  let currentY = startY;

  rows.forEach((row) => {
    // Center items within each row
    const rowStartX = center.x - row.totalWidth / 2;
    let currentX = rowStartX;

    row.indices.forEach((idx) => {
      const dim = dimensions[idx];
      // Vertically center item within the row's maxHeight
      const itemY = currentY + (row.maxHeight - dim.height) / 2;

      placements[idx] = {
        x: Math.round(currentX),
        y: Math.round(itemY),
        width: dim.width,
        height: dim.height,
      };

      currentX += dim.width + gap;
    });

    currentY += row.maxHeight + gap;
  });

  return placements;
}
