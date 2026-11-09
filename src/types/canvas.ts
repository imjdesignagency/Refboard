import { CropBox, ReferenceGridConfig } from '../models/board/Board';
export type { ReferenceGridConfig };

export interface ReferenceItem {
  id: string;
  type: 'image' | 'text' | 'stroke' | 'shape';
  name: string;
  src?: string;
  x: number;             // World space top-left X
  y: number;             // World space top-left Y
  width: number;         // World space width
  height: number;        // World space height
  rotation: number;      // Rotation in radians (-PI to PI)
  opacity: number;       // 0 to 1
  zIndex: number;        // Stacking order
  isLocked: boolean;     // Locked against accidental drag
  isVisible: boolean;    // Visibility toggle
  isFlippedH: boolean;   // Horizontal flip
  isFlippedV: boolean;   // Vertical flip
  aspectRatio: number;   // original width / height
  groupId?: string;
  crop?: CropBox;
  gridOverlay?: ReferenceGridConfig;

  // Text annotations
  text?: string;
  fontSize?: number;
  fontColor?: string;

  // Freehand vector strokes
  points?: { x: number; y: number }[];
  strokeWidth?: number;
  strokeColor?: string;

  // Shape callouts
  shapeType?: 'rectangle' | 'circle' | 'arrow';
  shapeColor?: string;
}

export interface ViewportTransform {
  x: number;             // Pan X in screen pixels
  y: number;             // Pan Y in screen pixels
  scale: number;         // Zoom factor (e.g. 0.1 to 5.0)
}

export type HandleType = 'none' | 'body' | 'tl' | 'tr' | 'bl' | 'br' | 'rotate';

export type ToolMode =
  | 'select'
  | 'pan'
  | 'pencil'
  | 'text'
  | 'shape'
  | 'eyedropper'
  | 'crop';

export interface Point {
  x: number;
  y: number;
}

export interface DragState {
  pointerId: number;
  mode:
    | 'pan'
    | 'item-drag'
    | 'multi-drag'
    | 'handle-transform'
    | 'marquee'
    | 'pencil-draw'
    | 'crop-drag';
  handleType?: HandleType;
  cropHandle?: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move';
  startScreenPoint: Point;
  lastScreenPoint: Point;
  startWorldPoint: Point;
  startTransform: ViewportTransform;
  startItemState?: ReferenceItem;
  startItemsMap?: Map<string, { x: number; y: number; width: number; height: number; rotation: number }>;
  targetItemId?: string;
  // For rotation
  initialRotation?: number;
  centerScreenPoint?: Point;
}

export interface MarqueeBox {
  start: Point;
  current: Point;
}

export interface HistoryEntry {
  items: ReferenceItem[];
  selectedIds: string[];
}
