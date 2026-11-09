import { HandleType, Point, ReferenceItem, ViewportTransform } from '../types/canvas';

export function screenToWorld(pt: Point, tf: ViewportTransform): Point {
  return {
    x: (pt.x - tf.x) / tf.scale,
    y: (pt.y - tf.y) / tf.scale,
  };
}

export function worldToScreen(pt: Point, tf: ViewportTransform): Point {
  return {
    x: pt.x * tf.scale + tf.x,
    y: pt.y * tf.scale + tf.y,
  };
}

export function rotatePoint(pt: Point, center: Point, angleRad: number): Point {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = pt.x - center.x;
  const dy = pt.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function getItemCenter(item: ReferenceItem): Point {
  return {
    x: item.x + item.width / 2,
    y: item.y + item.height / 2,
  };
}

export function getItemCorners(item: ReferenceItem): {
  tl: Point;
  tr: Point;
  bl: Point;
  br: Point;
  rotateHandle: Point;
} {
  const center = getItemCenter(item);
  const halfW = item.width / 2;
  const halfH = item.height / 2;

  // Unrotated relative points
  const rawTL = { x: center.x - halfW, y: center.y - halfH };
  const rawTR = { x: center.x + halfW, y: center.y - halfH };
  const rawBL = { x: center.x - halfW, y: center.y + halfH };
  const rawBR = { x: center.x + halfW, y: center.y + halfH };

  // Rotation handle sits 32 world-pixels above top center
  const rawRotate = { x: center.x, y: center.y - halfH - 28 };

  return {
    tl: rotatePoint(rawTL, center, item.rotation),
    tr: rotatePoint(rawTR, center, item.rotation),
    bl: rotatePoint(rawBL, center, item.rotation),
    br: rotatePoint(rawBR, center, item.rotation),
    rotateHandle: rotatePoint(rawRotate, center, item.rotation),
  };
}

export function isPointInRotatedRect(worldPoint: Point, item: ReferenceItem): boolean {
  const center = getItemCenter(item);
  // Transform worldPoint into item's local coordinate space by rotating by -rotation
  const localPt = rotatePoint(worldPoint, center, -item.rotation);
  const halfW = item.width / 2;
  const halfH = item.height / 2;

  return (
    localPt.x >= center.x - halfW &&
    localPt.x <= center.x + halfW &&
    localPt.y >= center.y - halfH &&
    localPt.y <= center.y + halfH
  );
}

export function hitTestHandle(
  screenPoint: Point,
  item: ReferenceItem,
  tf: ViewportTransform,
  hitRadius = 24 // Generous touch hitbox for iPad
): HandleType {
  const corners = getItemCorners(item);
  const screenCorners = {
    tl: worldToScreen(corners.tl, tf),
    tr: worldToScreen(corners.tr, tf),
    bl: worldToScreen(corners.bl, tf),
    br: worldToScreen(corners.br, tf),
    rotate: worldToScreen(corners.rotateHandle, tf),
  };

  const distSq = (p1: Point, p2: Point) => (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
  const rSq = hitRadius * hitRadius;

  if (distSq(screenPoint, screenCorners.rotate) <= rSq) return 'rotate';
  if (distSq(screenPoint, screenCorners.tl) <= rSq) return 'tl';
  if (distSq(screenPoint, screenCorners.tr) <= rSq) return 'tr';
  if (distSq(screenPoint, screenCorners.br) <= rSq) return 'br';
  if (distSq(screenPoint, screenCorners.bl) <= rSq) return 'bl';

  return 'none';
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
