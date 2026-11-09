export interface CropBox {
  x: number;       // Normalized 0 to 1
  y: number;       // Normalized 0 to 1
  width: number;   // Normalized 0 to 1
  height: number;  // Normalized 0 to 1
}

export interface ReferenceGridConfig {
  enabled: boolean;
  rows: number;          // 2 to 32 (default: 4)
  columns: number;       // 2 to 32 (default: 4)
  color: string;         // Hex or CSS color string (default: '#38bdf8')
  opacity: number;       // 0.1 to 1.0 (default: 0.85)
  lineWidth: number;     // Line stroke width in px (default: 1.5)
  showNumbering: boolean;// Show 1, 2, 3... coordinate badges (default: true)
  lockSquare?: boolean;  // Maintain square aspect grid cells
}

export interface BoardElement {
  id: string;
  type: 'image' | 'text' | 'stroke' | 'shape';
  name: string;
  src?: string;
  assetId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  isLocked: boolean;
  isVisible: boolean;
  isFlippedH: boolean;
  isFlippedV: boolean;
  aspectRatio: number;
  groupId?: string;
  crop?: CropBox;
  gridOverlay?: ReferenceGridConfig;

  // Text annotation attributes
  text?: string;
  fontSize?: number;
  fontColor?: string;

  // Freehand vector stroke attributes
  points?: { x: number; y: number }[];
  strokeWidth?: number;
  strokeColor?: string;

  // Shape callout attributes
  shapeType?: 'rectangle' | 'circle' | 'arrow';
  shapeColor?: string;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  elements: BoardElement[];
  createdAt: number;
  updatedAt: number;
}
