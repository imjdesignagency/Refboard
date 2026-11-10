import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  DragState,
  HandleType,
  MarqueeBox,
  Point,
  ReferenceItem,
  ToolMode,
  ViewportTransform,
} from '../types/canvas';
import { CropBox } from '../models/board/Board';
import { getImage, loadImage, isImageFailed, getDisplayImage } from '../utils/imageLoader';
import {
  clamp,
  getItemCenter,
  getItemCorners,
  hitTestHandle,
  isPointInRotatedRect,
  rotatePoint,
  screenToWorld,
  worldToScreen,
} from '../utils/math';
import { drawReferenceGrid } from '../utils/gridRenderer';
import { Check, X, RotateCcw } from 'lucide-react';

export interface MainCanvasHandle {
  runCameraBenchmarkSweep: (
    onFrameProgress: (instantFps: number, frameTimeMs: number, progress: number) => void
  ) => Promise<{
    avgFps: number;
    onePercentLowFps: number;
    totalFrames: number;
    droppedFrames: number;
    avgFrameTimeMs: number;
    maxFrameTimeMs: number;
    durationMs: number;
  }>;
}

interface MainCanvasProps {
  items: ReferenceItem[];
  selectedIds: string[];
  toolMode: ToolMode;
  transform: ViewportTransform;
  cropItemId: string | null;
  pencilColor: string;
  pencilWidth: number;
  onSelect: (ids: string[]) => void;
  onUpdateItems: (items: ReferenceItem[], recordHistory?: boolean) => void;
  onUpdateTransform: (tf: ViewportTransform) => void;
  onApplyCrop: (itemId: string, newCrop: CropBox) => void;
  onCancelCrop: () => void;
  onPickColor: (hex: string) => void;
  onCreateText: (worldPt: Point) => void;
  onCreateShape: (worldPt: Point) => void;
}

export const MainCanvas = React.forwardRef<MainCanvasHandle, MainCanvasProps>(
  function MainCanvas(
    {
      items,
      selectedIds,
      toolMode,
      transform,
      cropItemId,
      pencilColor,
      pencilWidth,
      onSelect,
      onUpdateItems,
      onUpdateTransform,
      onApplyCrop,
      onCancelCrop,
      onPickColor,
      onCreateText,
      onCreateShape,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active pointers map for multitouch (pinch-to-zoom & two-finger pan)
  const activePointersRef = useRef<Map<number, Point>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const pinchStartMidpointRef = useRef<Point>({ x: 0, y: 0 });
  const pinchStartTransformRef = useRef<ViewportTransform>({ x: 0, y: 0, scale: 1 });

  // Single-pointer drag state
  const dragStateRef = useRef<DragState | null>(null);

  // Marquee selection box
  const [marquee, setMarquee] = useState<MarqueeBox | null>(null);

  // In-canvas live crop draft state
  const [draftCrop, setDraftCrop] = useState<CropBox>({ x: 0, y: 0, width: 1, height: 1 });

  // Active pencil stroke in progress
  const activeStrokeRef = useRef<{ x: number; y: number }[] | null>(null);

  // Eyedropper magnifier loupe state
  const [loupe, setLoupe] = useState<{ x: number; y: number; color: string } | null>(null);

  // Spacebar pan tracking for desktop/keyboard users
  const isSpacePressedRef = useRef<boolean>(false);
  const [isSpaceActive, setIsSpaceActive] = useState(false);

  // Dynamic feedback HUD (e.g. angle or dimension while transforming)
  const [transformFeedback, setTransformFeedback] = useState<{
    text: string;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Sync props to refs for high-fps pointer handling
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const toolModeRef = useRef(toolMode);
  toolModeRef.current = toolMode;
  const cropItemIdRef = useRef(cropItemId);
  cropItemIdRef.current = cropItemId;

  const hasModifiedRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const sortedItemsRef = useRef<ReferenceItem[]>([]);
  const lastTransformChangeRef = useRef<number>(0);

  // Maintain pre-sorted z-index cache to eliminate per-frame allocations
  useEffect(() => {
    sortedItemsRef.current = [...items].sort((a, b) => a.zIndex - b.zIndex);
  }, [items]);

  // Initialize draft crop when cropItemId changes
  useEffect(() => {
    if (cropItemId) {
      const target = items.find((it) => it.id === cropItemId);
      if (target?.crop) {
        setDraftCrop({ ...target.crop });
      } else {
        setDraftCrop({ x: 0, y: 0, width: 1, height: 1 });
      }
    }
  }, [cropItemId, items]);

  // Handle keyboard shortcuts (Spacebar for pan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        setIsSpaceActive(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsSpaceActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const currentTf = transformRef.current;
    const currentItems = itemsRef.current;
    const currentSelIds = selectedIdsRef.current;
    const activeCropId = cropItemIdRef.current;

    // Clear canvas
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Canvas background
    ctx.fillStyle = '#141518';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid dots (batched into a single hardware GPU path operation)
    const gridSize = 48 * currentTf.scale;
    if (gridSize >= 14) {
      const offsetX = ((currentTf.x % gridSize) + gridSize) % gridSize;
      const offsetY = ((currentTf.y % gridSize) + gridSize) % gridSize;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
      const dotRadius = Math.max(1, Math.min(1.5, currentTf.scale * 1.1));
      ctx.beginPath();
      for (let x = offsetX; x < width; x += gridSize) {
        for (let y = offsetY; y < height; y += gridSize) {
          ctx.moveTo(x + dotRadius, y);
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }

    // Adaptive image smoothing: low/medium during active pan/zoom motion sweeps, high at rest
    const isMoving =
      dragStateRef.current !== null ||
      performance.now() - lastTransformChangeRef.current < 120;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = isMoving ? 'low' : 'high';

    // Use cached sorted array to eliminate per-frame allocations during 60 FPS motion
    const sorted = sortedItemsRef.current.length > 0 ? sortedItemsRef.current : currentItems;

    // Draw visible items with viewport frustum culling
    for (const item of sorted) {
      if (item.isVisible === false) continue;

      const center = getItemCenter(item);
      const screenCenter = worldToScreen(center, currentTf);
      const screenW = item.width * currentTf.scale;
      const screenH = item.height * currentTf.scale;

      // Viewport Frustum Culling: Skip items that are completely outside the visible canvas
      const halfDiagonal = Math.hypot(screenW, screenH) / 2 + 20;
      if (
        screenCenter.x + halfDiagonal < 0 ||
        screenCenter.x - halfDiagonal > width ||
        screenCenter.y + halfDiagonal < 0 ||
        screenCenter.y - halfDiagonal > height
      ) {
        continue;
      }

      ctx.save();
      ctx.translate(screenCenter.x, screenCenter.y);
      ctx.rotate(item.rotation);
      ctx.globalAlpha = item.opacity;

      if (item.type === 'image' && item.src) {
        if (item.isFlippedH || item.isFlippedV) {
          ctx.scale(item.isFlippedH ? -1 : 1, item.isFlippedV ? -1 : 1);
        }

        const img = getDisplayImage(item.src, screenW);
        if (img) {
          // Hardware-accelerated drop shadow (eliminates expensive Skia Gaussian blur passes)
          const shadowOffset = Math.max(2, Math.min(8, 4 * currentTf.scale));
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.fillRect(-screenW / 2 + 1, -screenH / 2 + shadowOffset, screenW, screenH);

          // If item is being cropped right now, show full image with crop overlay
          if (activeCropId === item.id) {
            ctx.drawImage(img, -screenW / 2, -screenH / 2, screenW, screenH);
          } else if (item.crop) {
            const fullImg = getImage(item.src) || img;
            const nw = 'naturalWidth' in fullImg ? fullImg.naturalWidth : fullImg.width;
            const nh = 'naturalHeight' in fullImg ? fullImg.naturalHeight : fullImg.height;
            const sx = item.crop.x * nw;
            const sy = item.crop.y * nh;
            const sw = item.crop.width * nw;
            const sh = item.crop.height * nh;
            ctx.drawImage(fullImg, sx, sy, sw, sh, -screenW / 2, -screenH / 2, screenW, screenH);
          } else {
            ctx.drawImage(img, -screenW / 2, -screenH / 2, screenW, screenH);
          }

          // Subtle hairline border for crisp reference separation
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(-screenW / 2, -screenH / 2, screenW, screenH);

          // Draw reference grid overlay if enabled
          if (item.gridOverlay?.enabled) {
            drawReferenceGrid(
              ctx,
              item.gridOverlay,
              screenW,
              screenH,
              currentTf.scale,
              item.isFlippedH,
              item.isFlippedV
            );
          }
        } else {
          if (!isImageFailed(item.src)) {
            loadImage(item.src)
              .then(() => {
                if (rafIdRef.current === null) {
                  rafIdRef.current = requestAnimationFrame(() => {
                    rafIdRef.current = null;
                    draw();
                  });
                }
              })
              .catch(() => {});
          }
          ctx.fillStyle = '#212328';
          ctx.strokeStyle = '#343842';
          ctx.lineWidth = 1;
          ctx.fillRect(-screenW / 2, -screenH / 2, screenW, screenH);
          ctx.strokeRect(-screenW / 2, -screenH / 2, screenW, screenH);
          ctx.fillStyle = '#8e96a4';
          ctx.font = '12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(isImageFailed(item.src) ? 'Image Unavailable' : item.name || 'Loading...', 0, 0);
        }
      } else if (item.type === 'stroke' && item.points && item.points.length > 1) {
        // Draw vector spline in world space relative to center
        ctx.beginPath();
        const startPt = item.points[0];
        ctx.moveTo((startPt.x - center.x) * currentTf.scale, (startPt.y - center.y) * currentTf.scale);
        for (let i = 1; i < item.points.length; i++) {
          const pt = item.points[i];
          ctx.lineTo((pt.x - center.x) * currentTf.scale, (pt.y - center.y) * currentTf.scale);
        }
        ctx.strokeStyle = item.strokeColor || '#3b82f6';
        ctx.lineWidth = Math.max(1, (item.strokeWidth || 4) * currentTf.scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      } else if (item.type === 'text') {
        ctx.fillStyle = 'rgba(28, 29, 34, 0.85)';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.fillRect(-screenW / 2, -screenH / 2, screenW, screenH);
        ctx.strokeRect(-screenW / 2, -screenH / 2, screenW, screenH);

        ctx.fillStyle = item.fontColor || '#ffffff';
        ctx.font = `${Math.max(10, (item.fontSize || 16) * currentTf.scale)}px system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(item.text || 'Text Note', -screenW / 2 + 10, -screenH / 2 + 10);
      } else if (item.type === 'shape') {
        ctx.strokeStyle = item.shapeColor || '#3b82f6';
        ctx.lineWidth = Math.max(1.5, 3 * currentTf.scale);
        if (item.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(0, 0, screenW / 2, screenH / 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeRect(-screenW / 2, -screenH / 2, screenW, screenH);
        }
      }

      ctx.restore();
    }

    // Draw active stroke while drawing
    if (activeStrokeRef.current && activeStrokeRef.current.length > 1) {
      ctx.save();
      ctx.beginPath();
      const p0 = worldToScreen(activeStrokeRef.current[0], currentTf);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < activeStrokeRef.current.length; i++) {
        const p = worldToScreen(activeStrokeRef.current[i], currentTf);
        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = pencilColor;
      ctx.lineWidth = Math.max(1, pencilWidth * currentTf.scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // Draw Crop Mode Overlay if active
    if (activeCropId) {
      const cropItem = currentItems.find((it) => it.id === activeCropId);
      if (cropItem) {
        const center = getItemCenter(cropItem);
        const scCenter = worldToScreen(center, currentTf);
        const scW = cropItem.width * currentTf.scale;
        const scH = cropItem.height * currentTf.scale;

        ctx.save();
        ctx.translate(scCenter.x, scCenter.y);
        ctx.rotate(cropItem.rotation);

        // Crop rect relative to unrotated item top-left (-scW/2, -scH/2)
        const cropX = -scW / 2 + draftCrop.x * scW;
        const cropY = -scH / 2 + draftCrop.y * scH;
        const cropW = draftCrop.width * scW;
        const cropH = draftCrop.height * scH;

        // Dark dimming outside crop rect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        // Top
        ctx.fillRect(-scW / 2, -scH / 2, scW, cropY - (-scH / 2));
        // Bottom
        ctx.fillRect(-scW / 2, cropY + cropH, scW, scH / 2 - (cropY + cropH));
        // Left
        ctx.fillRect(-scW / 2, cropY, cropX - (-scW / 2), cropH);
        // Right
        ctx.fillRect(cropX + cropW, cropY, scW / 2 - (cropX + cropW), cropH);

        // Crop border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(cropX, cropY, cropW, cropH);

        // Grid lines (rule of thirds inside crop)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cropX + cropW / 3, cropY);
        ctx.lineTo(cropX + cropW / 3, cropY + cropH);
        ctx.moveTo(cropX + (cropW * 2) / 3, cropY);
        ctx.lineTo(cropX + (cropW * 2) / 3, cropY + cropH);
        ctx.moveTo(cropX, cropY + cropH / 3);
        ctx.lineTo(cropX + cropW, cropY + cropH / 3);
        ctx.moveTo(cropX, cropY + (cropH * 2) / 3);
        ctx.lineTo(cropX + cropW, cropY + (cropH * 2) / 3);
        ctx.stroke();

        // 8 Crop handles (white squares with shadow)
        const drawHandle = (hx: number, hy: number) => {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.fillRect(hx - 5, hy - 5, 10, 10);
          ctx.strokeRect(hx - 5, hy - 5, 10, 10);
        };

        drawHandle(cropX, cropY);
        drawHandle(cropX + cropW / 2, cropY);
        drawHandle(cropX + cropW, cropY);
        drawHandle(cropX + cropW, cropY + cropH / 2);
        drawHandle(cropX + cropW, cropY + cropH);
        drawHandle(cropX + cropW / 2, cropY + cropH);
        drawHandle(cropX, cropY + cropH);
        drawHandle(cropX, cropY + cropH / 2);

        ctx.restore();
      }
    }

    // Draw Selection Bounding Box(es)
    if (!activeCropId) {
      if (currentSelIds.length === 1) {
        const selectedItem = currentItems.find((it) => it.id === currentSelIds[0]);
        if (selectedItem && selectedItem.isVisible !== false) {
          const corners = getItemCorners(selectedItem);
          const scTL = worldToScreen(corners.tl, currentTf);
          const scTR = worldToScreen(corners.tr, currentTf);
          const scBR = worldToScreen(corners.br, currentTf);
          const scBL = worldToScreen(corners.bl, currentTf);
          const scRotate = worldToScreen(corners.rotateHandle, currentTf);

          const topCenterWorld = {
            x: (corners.tl.x + corners.tr.x) / 2,
            y: (corners.tl.y + corners.tr.y) / 2,
          };
          const scTopCenter = worldToScreen(topCenterWorld, currentTf);

          ctx.save();

          // Selection Box
          ctx.beginPath();
          ctx.moveTo(scTL.x, scTL.y);
          ctx.lineTo(scTR.x, scTR.y);
          ctx.lineTo(scBR.x, scBR.y);
          ctx.lineTo(scBL.x, scBL.y);
          ctx.closePath();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Rotation arm
          ctx.beginPath();
          ctx.moveTo(scTopCenter.x, scTopCenter.y);
          ctx.lineTo(scRotate.x, scRotate.y);
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Rotation handle
          ctx.beginPath();
          ctx.arc(scRotate.x, scRotate.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#3b82f6';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Corner handles
          const handleSize = 10;
          const drawCornerHandle = (p: Point) => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            ctx.shadowBlur = 4;
            ctx.fillRect(p.x - handleSize / 2, p.y - handleSize / 2, handleSize, handleSize);
            ctx.strokeRect(p.x - handleSize / 2, p.y - handleSize / 2, handleSize, handleSize);
          };

          drawCornerHandle(scTL);
          drawCornerHandle(scTR);
          drawCornerHandle(scBR);
          drawCornerHandle(scBL);

          ctx.restore();
        }
      } else if (currentSelIds.length > 1) {
        // Multi-selection: draw bounding box around all selected items
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        currentItems
          .filter((it) => currentSelIds.includes(it.id))
          .forEach((it) => {
            const corners = getItemCorners(it);
            [corners.tl, corners.tr, corners.br, corners.bl].forEach((pt) => {
              minX = Math.min(minX, pt.x);
              minY = Math.min(minY, pt.y);
              maxX = Math.max(maxX, pt.x);
              maxY = Math.max(maxY, pt.y);
            });
          });

        if (minX !== Infinity) {
          const scTL = worldToScreen({ x: minX, y: minY }, currentTf);
          const scBR = worldToScreen({ x: maxX, y: maxY }, currentTf);

          ctx.save();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(scTL.x, scTL.y, scBR.x - scTL.x, scBR.y - scTL.y);

          ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
          ctx.fillRect(scTL.x, scTL.y, scBR.x - scTL.x, scBR.y - scTL.y);
          ctx.restore();
        }
      }
    }

    // Draw Marquee selection rectangle
    if (marquee) {
      const p1 = worldToScreen(marquee.start, currentTf);
      const p2 = worldToScreen(marquee.current, currentTf);
      const mx = Math.min(p1.x, p2.x);
      const my = Math.min(p1.y, p2.y);
      const mw = Math.abs(p2.x - p1.x);
      const mh = Math.abs(p2.y - p1.y);

      ctx.save();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(mx, my, mw, mh);

      ctx.fillStyle = 'rgba(96, 165, 250, 0.15)';
      ctx.fillRect(mx, my, mw, mh);
      ctx.restore();
    }

    ctx.restore();
  }, [draftCrop, pencilColor, pencilWidth]);

  // RAF throttled render queue to prevent multiple redundant redraws per frame
  const requestDraw = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      draw();
    });
  }, [draw]);

  // Expose imperative camera sweep benchmark runner for 60 FPS isolation
  useImperativeHandle(ref, () => ({
    runCameraBenchmarkSweep: async (onFrameProgress) => {
      const initialTf = { ...transformRef.current };
      const sweepDuration = 2500;
      const startTime = performance.now();
      const frameDeltas: number[] = [];
      let lastTime = startTime;
      let lastProgressUpdate = 0;

      await new Promise<void>((resolve) => {
        const animate = () => {
          const now = performance.now();
          const delta = now - lastTime;
          lastTime = now;
          frameDeltas.push(delta);

          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / sweepDuration);

          // Update camera directly on ref without triggering React reconciliation on every frame
          const angle = progress * Math.PI * 4;
          const offsetX = Math.sin(angle) * 360;
          const offsetY = Math.cos(angle * 0.5) * 200;
          const scaleOscillation = initialTf.scale * (1 + 0.3 * Math.sin(progress * Math.PI * 2));

          transformRef.current = {
            x: initialTf.x + offsetX,
            y: initialTf.y + offsetY,
            scale: scaleOscillation,
          };
          lastTransformChangeRef.current = now;

          // Render canvas directly in this exact RAF tick!
          draw();

          const instantFps = Math.min(120, Math.round(1000 / Math.max(1, delta)));

          // Throttle progress update callback so React UI updates smoothly without bottlenecking the 60Hz canvas
          if (now - lastProgressUpdate > 120 || progress >= 1) {
            lastProgressUpdate = now;
            onFrameProgress(instantFps, Math.round(delta), progress);
          }

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            transformRef.current = initialTf;
            draw();
            resolve();
          }
        };

        requestAnimationFrame(animate);
      });

      const totalSweepDuration = performance.now() - startTime;
      const sortedDeltas = [...frameDeltas].sort((a, b) => a - b);
      const p99Index = Math.min(
        sortedDeltas.length - 1,
        Math.floor(sortedDeltas.length * 0.99)
      );
      const p99Delta = sortedDeltas[p99Index] || 16.6;

      const medianIndex = Math.floor(sortedDeltas.length / 2);
      const medianDelta = sortedDeltas[medianIndex] || 16.6;
      // Auto-detect display cadence: jank threshold is 1.5x median or 48ms minimum
      const jankThreshold = Math.max(48, medianDelta * 1.5);
      const droppedFrames = frameDeltas.filter((d) => d > jankThreshold).length;

      const avgFps = Math.min(
        120,
        Math.round(frameDeltas.length / (totalSweepDuration / 1000))
      );
      const onePercentLowFps = Math.min(120, Math.round(1000 / Math.max(1, p99Delta)));
      const avgFrameTimeMs = Number(
        (frameDeltas.reduce((a, b) => a + b, 0) / Math.max(1, frameDeltas.length)).toFixed(1)
      );
      const maxFrameTimeMs = Number((Math.max(...frameDeltas, 0)).toFixed(1));

      return {
        avgFps,
        onePercentLowFps,
        totalFrames: frameDeltas.length,
        droppedFrames,
        avgFrameTimeMs,
        maxFrameTimeMs,
        durationMs: Math.round(totalSweepDuration),
      };
    },
  }));

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Canvas resize and retina sync
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      requestDraw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [requestDraw]);

  // Redraw when state changes, recording motion timestamp for dynamic smoothing
  useEffect(() => {
    lastTransformChangeRef.current = performance.now();
    requestDraw();

    // Settle redraw to restore high-quality image smoothing once motion stops
    const settleTimer = setTimeout(() => {
      requestDraw();
    }, 140);

    return () => clearTimeout(settleTimer);
  }, [items, selectedIds, transform, cropItemId, draftCrop, marquee, requestDraw]);

  // Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const screenPt: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const currentTf = transformRef.current;
    const worldPt = screenToWorld(screenPt, currentTf);

    // Register pointer for multi-touch
    activePointersRef.current.set(e.pointerId, screenPt);

    // Multitouch gesture detection (Pinch to zoom / 2-finger pan)
    if (activePointersRef.current.size === 2) {
      dragStateRef.current = null;
      setTransformFeedback(null);
      setMarquee(null);

      const pts = Array.from(activePointersRef.current.values());
      const p1 = pts[0];
      const p2 = pts[1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const mid: Point = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = currentTf.scale;
      pinchStartMidpointRef.current = mid;
      pinchStartTransformRef.current = { ...currentTf };
      return;
    }

    if (activePointersRef.current.size > 2) return;

    hasModifiedRef.current = false;

    // Eyedropper Sampling
    if (toolModeRef.current === 'eyedropper') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const pixel = ctx.getImageData(screenPt.x * dpr, screenPt.y * dpr, 1, 1).data;
        const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
          .toString(16)
          .slice(1)}`;
        onPickColor(hex);
        setLoupe({ x: screenPt.x, y: screenPt.y, color: hex });
      }
      return;
    }

    // Text Annotation creation
    if (toolModeRef.current === 'text') {
      onCreateText(worldPt);
      return;
    }

    // Shape callout creation
    if (toolModeRef.current === 'shape') {
      onCreateShape(worldPt);
      return;
    }

    // Pencil Freehand drawing
    if (toolModeRef.current === 'pencil') {
      activeStrokeRef.current = [worldPt];
      dragStateRef.current = {
        pointerId: e.pointerId,
        mode: 'pencil-draw',
        startScreenPoint: screenPt,
        lastScreenPoint: screenPt,
        startWorldPoint: worldPt,
        startTransform: { ...currentTf },
      };
      return;
    }

    // Spacebar pan tracking or dedicated Pan tool
    if (isSpacePressedRef.current || toolModeRef.current === 'pan' || e.button === 1) {
      dragStateRef.current = {
        pointerId: e.pointerId,
        mode: 'pan',
        startScreenPoint: screenPt,
        lastScreenPoint: screenPt,
        startWorldPoint: worldPt,
        startTransform: { ...currentTf },
      };
      return;
    }

    // In-Canvas Crop Mode interaction
    if (cropItemIdRef.current) {
      dragStateRef.current = {
        pointerId: e.pointerId,
        mode: 'crop-drag',
        startScreenPoint: screenPt,
        lastScreenPoint: screenPt,
        startWorldPoint: worldPt,
        startTransform: { ...currentTf },
      };
      return;
    }

    // Select Tool: Handle Hit Testing on primary selection
    const currentItems = itemsRef.current;
    const currentSelIds = selectedIdsRef.current;

    if (currentSelIds.length === 1) {
      const activeItem = currentItems.find((it) => it.id === currentSelIds[0]);
      if (activeItem && !activeItem.isLocked) {
        const handleHit = hitTestHandle(screenPt, activeItem, currentTf, 26);
        if (handleHit !== 'none') {
          const center = getItemCenter(activeItem);
          dragStateRef.current = {
            pointerId: e.pointerId,
            mode: 'handle-transform',
            handleType: handleHit,
            startScreenPoint: screenPt,
            lastScreenPoint: screenPt,
            startWorldPoint: worldPt,
            startTransform: { ...currentTf },
            startItemState: { ...activeItem },
            targetItemId: activeItem.id,
            initialRotation: activeItem.rotation,
            centerScreenPoint: worldToScreen(center, currentTf),
          };
          return;
        }
      }
    }

    // Hit test items in reverse z-order (topmost first)
    const sortedDesc = [...currentItems].sort((a, b) => b.zIndex - a.zIndex);
    let hitItem: ReferenceItem | null = null;

    for (const it of sortedDesc) {
      if (it.isVisible !== false && isPointInRotatedRect(worldPt, it)) {
        hitItem = it;
        break;
      }
    }

    if (hitItem) {
      const isShift = e.shiftKey;
      let newSelection: string[] = [];

      if (isShift) {
        // Toggle item in multi-selection
        if (currentSelIds.includes(hitItem.id)) {
          newSelection = currentSelIds.filter((id) => id !== hitItem!.id);
        } else {
          newSelection = [...currentSelIds, hitItem.id];
        }
      } else {
        // If clicking on an already multi-selected item, preserve selection for group drag
        if (currentSelIds.includes(hitItem.id)) {
          newSelection = currentSelIds;
        } else {
          newSelection = [hitItem.id];
        }
      }

      onSelect(newSelection);

      // Start drag (single or multi-item)
      const startMap = new Map();
      currentItems
        .filter((it) => newSelection.includes(it.id))
        .forEach((it) => {
          startMap.set(it.id, {
            x: it.x,
            y: it.y,
            width: it.width,
            height: it.height,
            rotation: it.rotation,
          });
        });

      dragStateRef.current = {
        pointerId: e.pointerId,
        mode: newSelection.length > 1 ? 'multi-drag' : 'item-drag',
        handleType: 'body',
        startScreenPoint: screenPt,
        lastScreenPoint: screenPt,
        startWorldPoint: worldPt,
        startTransform: { ...currentTf },
        startItemState: { ...hitItem },
        startItemsMap: startMap,
        targetItemId: hitItem.id,
      };
    } else {
      // Clicked on empty canvas
      if (!e.shiftKey) {
        onSelect([]);
      }
      // Start Marquee selection drag
      setMarquee({ start: worldPt, current: worldPt });
      dragStateRef.current = {
        pointerId: e.pointerId,
        mode: 'marquee',
        startScreenPoint: screenPt,
        lastScreenPoint: screenPt,
        startWorldPoint: worldPt,
        startTransform: { ...currentTf },
      };
    }
  };

  // Pointer Move handler
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenPt: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const currentTf = transformRef.current;
    const worldPt = screenToWorld(screenPt, currentTf);

    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, screenPt);
    }

    // Eyedropper Live Loupe
    if (toolModeRef.current === 'eyedropper') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const pixel = ctx.getImageData(screenPt.x * dpr, screenPt.y * dpr, 1, 1).data;
        const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
          .toString(16)
          .slice(1)}`;
        setLoupe({ x: screenPt.x, y: screenPt.y, color: hex });
      }
      return;
    }

    // 2-Finger pinch & pan
    if (activePointersRef.current.size === 2 && pinchStartDistRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const p1 = pts[0];
      const p2 = pts[1];
      const currentDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const currentMid: Point = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      const scaleRatio = currentDist / pinchStartDistRef.current;
      const initialTf = pinchStartTransformRef.current;
      const newScale = clamp(initialTf.scale * scaleRatio, 0.05, 8.0);

      const worldMidX = (pinchStartMidpointRef.current.x - initialTf.x) / initialTf.scale;
      const worldMidY = (pinchStartMidpointRef.current.y - initialTf.y) / initialTf.scale;

      const newX = currentMid.x - worldMidX * newScale;
      const newY = currentMid.y - worldMidY * newScale;

      onUpdateTransform({
        x: newX,
        y: newY,
        scale: newScale,
      });
      return;
    }

    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    // Pencil draw stroke update
    if (drag.mode === 'pencil-draw' && activeStrokeRef.current) {
      activeStrokeRef.current.push(worldPt);
      draw();
      return;
    }

    // Marquee selection box update
    if (drag.mode === 'marquee') {
      setMarquee({ start: drag.startWorldPoint, current: worldPt });

      // Calculate enclosed items
      const minX = Math.min(drag.startWorldPoint.x, worldPt.x);
      const maxX = Math.max(drag.startWorldPoint.x, worldPt.x);
      const minY = Math.min(drag.startWorldPoint.y, worldPt.y);
      const maxY = Math.max(drag.startWorldPoint.y, worldPt.y);

      const enclosedIds: string[] = [];
      itemsRef.current.forEach((it) => {
        if (it.isVisible !== false) {
          const cx = it.x + it.width / 2;
          const cy = it.y + it.height / 2;
          if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) {
            enclosedIds.push(it.id);
          }
        }
      });
      onSelect(enclosedIds);
      return;
    }

    // Pan canvas
    if (drag.mode === 'pan') {
      const dx = screenPt.x - drag.startScreenPoint.x;
      const dy = screenPt.y - drag.startScreenPoint.y;
      onUpdateTransform({
        x: drag.startTransform.x + dx,
        y: drag.startTransform.y + dy,
        scale: drag.startTransform.scale,
      });
      return;
    }

    // Multi-item drag
    if (drag.mode === 'multi-drag' && drag.startItemsMap) {
      const dxWorld = (screenPt.x - drag.startScreenPoint.x) / currentTf.scale;
      const dyWorld = (screenPt.y - drag.startScreenPoint.y) / currentTf.scale;

      const updated = itemsRef.current.map((it) => {
        const startState = drag.startItemsMap!.get(it.id);
        if (startState) {
          return {
            ...it,
            x: startState.x + dxWorld,
            y: startState.y + dyWorld,
          };
        }
        return it;
      });

      hasModifiedRef.current = true;
      onUpdateItems(updated, false);
      return;
    }

    // Single item drag
    if (drag.mode === 'item-drag' && drag.startItemState) {
      const dxWorld = (screenPt.x - drag.startScreenPoint.x) / currentTf.scale;
      const dyWorld = (screenPt.y - drag.startScreenPoint.y) / currentTf.scale;

      const updated = itemsRef.current.map((it) => {
        if (it.id === drag.targetItemId) {
          return {
            ...it,
            x: drag.startItemState!.x + dxWorld,
            y: drag.startItemState!.y + dyWorld,
          };
        }
        return it;
      });

      hasModifiedRef.current = true;
      onUpdateItems(updated, false);
      return;
    }

    // Corner handle resize or rotation
    if (drag.mode === 'handle-transform' && drag.startItemState) {
      const startItem = drag.startItemState;
      const startCenter = getItemCenter(startItem);

      if (drag.handleType === 'rotate' && drag.centerScreenPoint) {
        const angle = Math.atan2(
          screenPt.y - drag.centerScreenPoint.y,
          screenPt.x - drag.centerScreenPoint.x
        );
        const newRotation = angle + Math.PI / 2;

        const updated = itemsRef.current.map((it) => {
          if (it.id === drag.targetItemId) {
            return {
              ...it,
              rotation: newRotation,
            };
          }
          return it;
        });

        hasModifiedRef.current = true;
        onUpdateItems(updated, false);

        let deg = Math.round((newRotation * 180) / Math.PI) % 360;
        if (deg < 0) deg += 360;
        setTransformFeedback({
          text: `${deg}°`,
          screenX: screenPt.x,
          screenY: screenPt.y - 28,
        });
        return;
      }

      // Corner handles: proportional resize
      const localPt = rotatePoint(worldPt, startCenter, -startItem.rotation);
      const minDim = 40;
      const aspect = startItem.aspectRatio || startItem.width / startItem.height;

      const halfW = startItem.width / 2;
      const halfH = startItem.height / 2;

      let fixedCornerLocal: Point = { x: 0, y: 0 };
      let dragSignX = 1;
      let dragSignY = 1;

      if (drag.handleType === 'br') {
        fixedCornerLocal = { x: startCenter.x - halfW, y: startCenter.y - halfH };
      } else if (drag.handleType === 'tl') {
        fixedCornerLocal = { x: startCenter.x + halfW, y: startCenter.y + halfH };
        dragSignX = -1;
        dragSignY = -1;
      } else if (drag.handleType === 'tr') {
        fixedCornerLocal = { x: startCenter.x - halfW, y: startCenter.y + halfH };
        dragSignX = 1;
        dragSignY = -1;
      } else if (drag.handleType === 'bl') {
        fixedCornerLocal = { x: startCenter.x + halfW, y: startCenter.y - halfH };
        dragSignX = -1;
        dragSignY = 1;
      }

      let candidateWidth = Math.max(minDim, Math.abs(localPt.x - fixedCornerLocal.x));
      let candidateHeight = candidateWidth / aspect;

      const newLocalCenterX = fixedCornerLocal.x + (dragSignX * candidateWidth) / 2;
      const newLocalCenterY = fixedCornerLocal.y + (dragSignY * candidateHeight) / 2;

      const newCenter = rotatePoint(
        { x: newLocalCenterX, y: newLocalCenterY },
        startCenter,
        startItem.rotation
      );

      const updated = itemsRef.current.map((it) => {
        if (it.id === drag.targetItemId) {
          return {
            ...it,
            width: candidateWidth,
            height: candidateHeight,
            x: newCenter.x - candidateWidth / 2,
            y: newCenter.y - candidateHeight / 2,
          };
        }
        return it;
      });

      hasModifiedRef.current = true;
      onUpdateItems(updated, false);

      setTransformFeedback({
        text: `${Math.round(candidateWidth)} × ${Math.round(candidateHeight)}px`,
        screenX: screenPt.x,
        screenY: screenPt.y - 28,
      });
    }
  };

  // Pointer Up handler
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
    }

    // Finalize Pencil stroke
    if (dragStateRef.current?.mode === 'pencil-draw' && activeStrokeRef.current) {
      if (activeStrokeRef.current.length > 2) {
        const strokeId = `stroke-${Date.now()}`;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        activeStrokeRef.current.forEach((pt) => {
          minX = Math.min(minX, pt.x);
          minY = Math.min(minY, pt.y);
          maxX = Math.max(maxX, pt.x);
          maxY = Math.max(maxY, pt.y);
        });

        const newStrokeItem: ReferenceItem = {
          id: strokeId,
          type: 'stroke',
          name: 'Pencil Markup',
          x: minX,
          y: minY,
          width: Math.max(20, maxX - minX),
          height: Math.max(20, maxY - minY),
          rotation: 0,
          opacity: 1,
          zIndex: itemsRef.current.length + 1,
          isLocked: false,
          isVisible: true,
          isFlippedH: false,
          isFlippedV: false,
          aspectRatio: (maxX - minX) / (maxY - minY || 1),
          points: [...activeStrokeRef.current],
          strokeWidth: pencilWidth,
          strokeColor: pencilColor,
        };

        const updated = [...itemsRef.current, newStrokeItem];
        onUpdateItems(updated, true);
      }
      activeStrokeRef.current = null;
    }

    // Finalize Marquee
    if (dragStateRef.current?.mode === 'marquee') {
      setMarquee(null);
    }

    if (dragStateRef.current && dragStateRef.current.pointerId === e.pointerId) {
      dragStateRef.current = null;
      setTransformFeedback(null);

      if (hasModifiedRef.current) {
        onUpdateItems(itemsRef.current, true);
        hasModifiedRef.current = false;
      }
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const currentTf = transformRef.current;

    const zoomFactor = e.ctrlKey
      ? Math.exp(-e.deltaY * 0.015)
      : Math.exp(-e.deltaY * 0.0018);

    const newScale = clamp(currentTf.scale * zoomFactor, 0.05, 8.0);

    const worldX = (mouseX - currentTf.x) / currentTf.scale;
    const worldY = (mouseY - currentTf.y) / currentTf.scale;

    onUpdateTransform({
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale,
      scale: newScale,
    });
  };

  const getCursorStyle = () => {
    if (isSpaceActive || toolMode === 'pan') {
      return dragStateRef.current?.mode === 'pan' ? 'grabbing' : 'grab';
    }
    if (toolMode === 'pencil') return 'crosshair';
    if (toolMode === 'eyedropper') return 'crosshair';
    if (toolMode === 'text') return 'text';
    if (toolMode === 'shape') return 'crosshair';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full overflow-hidden touch-none select-none bg-[#121316]"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="block w-full h-full touch-none"
        style={{ cursor: getCursorStyle() }}
      />

      {/* Eyedropper Magnifier Loupe */}
      {loupe && toolMode === 'eyedropper' && (
        <div
          className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3 flex items-center gap-2 p-1.5 rounded-xl bg-black/90 border border-white/20 shadow-2xl backdrop-blur-md"
          style={{ left: `${loupe.x}px`, top: `${loupe.y}px` }}
        >
          <div
            className="w-5 h-5 rounded-lg border border-white/40 shadow-inner"
            style={{ backgroundColor: loupe.color }}
          />
          <span className="font-mono text-xs text-white uppercase">{loupe.color}</span>
        </div>
      )}

      {/* Real-time transform dimension/angle badge */}
      {transformFeedback && (
        <div
          className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full px-2.5 py-1 rounded bg-black/85 text-blue-400 text-xs font-mono font-medium shadow-lg backdrop-blur-sm border border-white/10"
          style={{
            left: `${transformFeedback.screenX}px`,
            top: `${transformFeedback.screenY}px`,
          }}
        >
          {transformFeedback.text}
        </div>
      )}

      {/* Floating Crop Action Bar when in crop mode */}
      {cropItemId && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1c1d22]/95 border border-white/15 shadow-2xl backdrop-blur-md">
          <span className="text-xs font-medium text-white pr-2 border-r border-white/10">
            Cropping Reference Image
          </span>

          <button
            type="button"
            onClick={() => onApplyCrop(cropItemId, draftCrop)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Apply Crop</span>
          </button>

          <button
            type="button"
            onClick={() => setDraftCrop({ x: 0, y: 0, width: 1, height: 1 })}
            title="Reset crop to full image"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onCancelCrop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      )}
    </div>
  );
});
