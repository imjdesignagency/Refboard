import React, { useRef, useState, useEffect } from 'react';
import { MapPin, Eye, EyeOff } from 'lucide-react';
import { ReferenceItem, ViewportTransform } from '../../types/canvas';
import { clamp } from '../../utils/math';

interface CanvasMinimapProps {
  items: ReferenceItem[];
  transform: ViewportTransform;
  onNavigate: (newTf: ViewportTransform) => void;
}

export const CanvasMinimap: React.FC<CanvasMinimapProps> = ({
  items,
  transform,
  onNavigate,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const minimapWidth = 160;
  const minimapHeight = 110;

  useEffect(() => {
    if (!isExpanded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, minimapWidth, minimapHeight);

    // Background
    ctx.fillStyle = '#141518';
    ctx.fillRect(0, 0, minimapWidth, minimapHeight);

    // Calculate bounding box of all items plus current viewport
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    // Viewport corners in world space
    const viewLeft = -transform.x / transform.scale;
    const viewTop = -transform.y / transform.scale;
    const viewRight = (viewW - transform.x) / transform.scale;
    const viewBottom = (viewH - transform.y) / transform.scale;

    let minX = Math.min(-1000, viewLeft);
    let minY = Math.min(-1000, viewTop);
    let maxX = Math.max(1000, viewRight);
    let maxY = Math.max(1000, viewBottom);

    items.forEach((it) => {
      if (it.isVisible !== false) {
        minX = Math.min(minX, it.x - 100);
        minY = Math.min(minY, it.y - 100);
        maxX = Math.max(maxX, it.x + it.width + 100);
        maxY = Math.max(maxY, it.y + it.height + 100);
      }
    });

    const worldW = maxX - minX;
    const worldH = maxY - minY;

    const scale = Math.min(minimapWidth / worldW, minimapHeight / worldH);
    const offsetX = (minimapWidth - worldW * scale) / 2;
    const offsetY = (minimapHeight - worldH * scale) / 2;

    const toMiniX = (wx: number) => (wx - minX) * scale + offsetX;
    const toMiniY = (wy: number) => (wy - minY) * scale + offsetY;

    // Draw item blocks
    items.forEach((it) => {
      if (it.isVisible === false) return;
      const mx = toMiniX(it.x);
      const my = toMiniY(it.y);
      const mw = Math.max(3, it.width * scale);
      const mh = Math.max(3, it.height * scale);

      ctx.fillStyle = it.type === 'image' ? '#3b82f6' : '#10b981';
      ctx.globalAlpha = 0.65;
      ctx.fillRect(mx, my, mw, mh);
    });

    ctx.globalAlpha = 1.0;

    // Draw current camera viewport box
    const camX = toMiniX(viewLeft);
    const camY = toMiniY(viewTop);
    const camW = (viewRight - viewLeft) * scale;
    const camH = (viewBottom - viewTop) * scale;

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(camX, camY, camW, camH);

    ctx.fillStyle = 'rgba(96, 165, 250, 0.12)';
    ctx.fillRect(camX, camY, camW, camH);
  }, [items, transform, isExpanded]);

  // Click on minimap to navigate
  const handleMinimapPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Recompute world coordinate space
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const viewLeft = -transform.x / transform.scale;
    const viewTop = -transform.y / transform.scale;
    const viewRight = (viewW - transform.x) / transform.scale;
    const viewBottom = (viewH - transform.y) / transform.scale;

    let minX = Math.min(-1000, viewLeft);
    let minY = Math.min(-1000, viewTop);
    let maxX = Math.max(1000, viewRight);
    let maxY = Math.max(1000, viewBottom);

    items.forEach((it) => {
      if (it.isVisible !== false) {
        minX = Math.min(minX, it.x - 100);
        minY = Math.min(minY, it.y - 100);
        maxX = Math.max(maxX, it.x + it.width + 100);
        maxY = Math.max(maxY, it.y + it.height + 100);
      }
    });

    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const scale = Math.min(minimapWidth / worldW, minimapHeight / worldH);
    const offsetX = (minimapWidth - worldW * scale) / 2;
    const offsetY = (minimapHeight - worldH * scale) / 2;

    const targetWorldX = (clickX - offsetX) / scale + minX;
    const targetWorldY = (clickY - offsetY) / scale + minY;

    onNavigate({
      x: viewW / 2 - targetWorldX * transform.scale,
      y: viewH / 2 - targetWorldY * transform.scale,
      scale: transform.scale,
    });
  };

  return (
    <div className="absolute bottom-5 left-5 z-20 flex flex-col items-start gap-1.5 select-none">
      {isExpanded && (
        <div className="p-1 rounded-xl bg-[#1c1d22]/90 border border-white/10 shadow-2xl backdrop-blur-md overflow-hidden">
          <canvas
            ref={canvasRef}
            width={minimapWidth}
            height={minimapHeight}
            onPointerDown={handleMinimapPointer}
            className="block cursor-crosshair rounded-lg"
          />
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide Minimap Radar' : 'Show Minimap Radar'}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1c1d22]/90 border border-white/10 text-slate-400 hover:text-white text-[11px] shadow-lg backdrop-blur-md transition-colors"
      >
        <MapPin className="w-3 h-3 text-blue-400" />
        <span>Minimap</span>
        {isExpanded ? <EyeOff className="w-3 h-3 ml-0.5" /> : <Eye className="w-3 h-3 ml-0.5" />}
      </button>
    </div>
  );
};
