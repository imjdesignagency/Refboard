# REFBOARD — Reference Grid Overlay for Proportion Transfer

Add a dedicated, customizable **Reference Grid Overlay** system for 2D reference images on the REFBOARD canvas. This feature allows concept artists, illustrators, and fine artists to apply classical drawing grids (the grid method / quad transfer) over reference images with customizable rows, columns, colors, line thickness, opacity, and dual-axis numerical coordinates (1, 2, 3...).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences have been confirmed and will guide the implementation:

- **Confirmed: Target Placement**: Directly over individual reference images. The grid is attached to the reference item's local coordinates, automatically moving, scaling, rotating, and cropping with the image.
- **Confirmed: Control Location**: Dedicated "Reference Grid Overlay" section located inside the **Right Properties Panel** when an image is selected, plus a quick 1-click grid toggle button in the floating **Image Properties Bar**.
- **Confirmed: Numbering Scheme**: Numbers for both columns and rows (`1, 2, 3...`) along the grid margins, rendered with contrast-compensating badges so numbers remain legible over both dark and bright photography.
- **Confirmed: Customization Options**:
  - Independent **Rows** (2–32) and **Columns** (2–32) sliders and stepper inputs.
  - Quick **Square Grid** constraint option (locks cell aspect ratio to 1:1).
  - Curated artist color palette (Electric Cyan `#38bdf8`, Vibrant Coral `#f87171`, High-Vis Amber `#facc15`, Crisp White `#ffffff`, Pitch Obsidian `#18181b`, Neon Emerald `#4ade80`) plus full custom hex/color picker.
  - Grid line opacity slider ($20\% \dots 100\%$) and line stroke weight (1px, 1.5px, 2px, 3px).
  - Toggle for **Show Numbers** (row and column index labels).
- **Confirmed: High-Res Export & Persistence**: Grid configuration is fully persisted in IndexedDB via Dexie.js as part of `BoardElement` and renders during high-res PNG export (`exportBoardToPNG`).

---

### 1. Overview & Core Concept

- **What It Does**: Implements the classical artist "grid method" directly in digital reference workflows. Artists overlay a precision grid with numbered rows and columns onto any reference photo, sketch, or 3D snapshot, enabling exact proportion transfer onto physical sketchbooks, oil canvases, or split-screen drawing layers.
- **Target Audience**: Figurative artists, illustrators, comic pencillers, and art students who use proportional grids to transfer complex anatomy, perspective foreshortening, and facial likeness accurately.
- **Key Value**: Eliminates the need to switch out of REFBOARD to external grid tools or draw manual grid lines in separate software.

---

### 2. User Experience & Visual Design

#### Key User Flows

1. **Enabling the Grid on a Reference Image**:
   - The artist selects any reference image on the 2D canvas.
   - The **Right Properties Panel** slides open, displaying the new **Reference Grid** card.
   - The artist flips the switch: the image immediately displays an overlay grid. Alternatively, the artist can toggle the grid on/off with one click from the floating top **Image Properties Bar** using the new grid icon.

2. **Customizing Density & Proportions**:
   - The artist adjusts the **Rows** and **Columns** sliders or stepper inputs (default 4×4; range 2 to 32).
   - Toggling **Lock Square Cells** automatically balances rows and columns based on the image's dimensions so every grid square is geometrically uniform.

3. **Setting Color & Visibility**:
   - The artist selects a color swatch that contrasts best against the reference (e.g. Electric Cyan `#38bdf8` on skin tones, Amber Yellow `#facc15` on dark backgrounds, or White `#ffffff` on neutral photography).
   - The artist adjusts line opacity ($20\% \dots 100\%$) and line width ($1\text{px} \dots 3\text{px}$) for non-intrusive viewing.

4. **Coordinate Numbering for Proportion Transfer**:
   - Toggling **Show Row & Column Numbers** places clean numerical badges (`1, 2, 3...`) along the top edge for columns and along the left edge for rows.
   - Each number is rendered in a clean font with a subtle dark backdrop badge, guaranteeing legibility regardless of image contrast.

5. **Manipulation & Export**:
   - As the artist drags, rotates, scales, or crops the reference image on canvas, the grid overlay transforms in lockstep.
   - When exporting the board or viewport to high-res PNG, the grid overlay and numbers are rendered crisply into the exported image.

#### Visual Styling & Design System Tokens

- **Control Card**: Pinned within `RightPropertiesPanel.tsx` with subtle dark frosted styling (`bg-white/[0.03] border border-white/5 rounded-2xl`), matching REFBOARD's dark slate palette (`#1c1d22`, `#15161a`).
- **Color Swatches**: Circular color tokens with active glow rings, accompanied by a native color picker input.
- **Number Badges**: Micro typography (`font-mono tabular-nums text-[10px]`) rendered with a rounded pill-free backdrop box (`rgba(15, 17, 23, 0.75)`) and contrasting white/cyan text.

---

### 3. Key Product Decisions & Trade-Offs

#### 1. Image-Local Coordinates vs Canvas World Grid
- **Chosen Approach**: Attach the grid directly to the reference item's local coordinate space within the canvas render pipeline.
- **Why**: Artists need the grid to align precisely to the bounds of the specific reference image (and its crop window). As the reference is rotated, scaled, or moved on the board, the grid stays locked to the artwork.

#### 2. Canvas 2D Direct Render vs HTML DOM Overlay
- **Chosen Approach**: Draw the grid directly inside `MainCanvas.tsx`'s HTML5 Canvas 2D render loop, immediately following `ctx.drawImage()`.
- **Why**: Zero DOM overlay performance penalty during high-speed panning and zooming; automatically participates in canvas transform matrices, rotation, flips, opacity, and offscreen PNG export.

#### 3. Data Model Persistence
- **Chosen Approach**: Store a typed `gridOverlay?: ReferenceGridConfig` object on `BoardElement` and `ReferenceItem`.
- **Why**: Automatically persists to IndexedDB with Dexie.js without database migrations, participates in undo/redo canvas history, and supports multi-item duplication.

---

### 4. Technical Architecture & System Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              2D REFERENCE BOARD                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ HTML5 Main Canvas (2D Render Loop)                                     │  │
│  │                                                                        │  │
│  │   1. Background & Dots                                                 │  │
│  │   2. Reference Image Render (`ctx.drawImage`)                          │  │
│  │   3. NEW: Reference Grid Overlay (`drawReferenceGrid`)                 │  │
│  │        • Subdivided Column Lines (dx = width / cols)                   │  │
│  │        • Subdivided Row Lines (dy = height / rows)                     │  │
│  │        • Dual-Axis Numbers (Cols 1..M on top, Rows 1..N on left)       │  │
│  │   4. Vector Pencil Strokes & Annotations                               │  │
│  │   5. Selection Bounding Box & Handles                                  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ UI Controls                                                            │  │
│  │                                                                        │  │
│  │   • Right Properties Panel:                                            │  │
│  │       - Grid Toggle Switch                                             │  │
│  │       - Rows & Columns Steppers / Sliders (2–32)                       │  │
│  │       - Lock Square Aspect Ratio                                       │  │
│  │       - Color Swatches & Native Color Picker                           │  │
│  │       - Line Opacity & Thickness Steppers                              │  │
│  │       - Show Numbers (1, 2, 3...) Toggle                               │  │
│  │                                                                        │  │
│  │   • Floating Image Properties Bar:                                     │  │
│  │       - Quick 1-click Grid Toggle Button (`Grid3X3`)                   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Core Data Interface

```typescript
export interface ReferenceGridConfig {
  enabled: boolean;
  rows: number;               // 2 to 32 (default: 4)
  columns: number;            // 2 to 32 (default: 4)
  color: string;              // Hex string (default: '#38bdf8')
  opacity: number;            // 0.2 to 1.0 (default: 0.8)
  lineWidth: number;          // 1 to 4 (default: 1.5)
  showNumbering: boolean;     // Numbers for rows and columns (default: true)
  lockSquare?: boolean;       // Automatically maintain square cells
}
```

---

### Step-by-Step Implementation Sequence

1. **Step 1: Data Model & Types**
   - Update `src/models/board/Board.ts` and `src/types/canvas.ts` to include `ReferenceGridConfig` on `BoardElement` and `ReferenceItem`.

2. **Step 2: Canvas Grid Renderer**
   - In `src/components/MainCanvas.tsx`, implement `drawReferenceGrid(ctx, item, currentTf)`:
     - Calculates cell dimensions based on cropped or uncropped bounds.
     - Draws vertical and horizontal grid lines with configurable color, opacity, and line width.
     - Draws numbered coordinate labels (`1, 2, ... N`) along top and left cell boundaries with high-contrast text backing.
   - Update `src/utils/exportUtils.ts` to render the grid overlay during offscreen canvas PNG exports.

3. **Step 3: Properties Panel UI Controls**
   - In `src/components/Panels/RightPropertiesPanel.tsx`, build the **"Reference Grid Overlay"** control card:
     - Enable / Disable switch with active indicator.
     - Stepper buttons and range sliders for Rows and Columns.
     - "Square Cells" aspect-ratio constraint toggle.
     - 6 curated artist color presets + custom hex input.
     - Line opacity slider and thickness pills (1px, 1.5px, 2px, 3px).
     - "Show Coordinates (1, 2, 3...)" toggle.

4. **Step 4: Floating Bar Quick Toggle**
   - In `src/components/ImagePropertiesBar.tsx`, add a quick toggle button with `Grid3X3` icon from `lucide-react` to instantly turn the grid on/off.

5. **Step 5: Verification & Quality Assurance**
   - Co-execute `compile_applet` and `lint_applet` (`tsc --noEmit`).
   - Verify smooth panning, zooming, rotating, and cropping with the grid overlay active.
   - Verify coordinate numbering readability and high-res PNG export.
