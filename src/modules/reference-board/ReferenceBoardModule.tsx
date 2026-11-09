import React, { useCallback, useEffect, useState } from 'react';
import { MainCanvas } from '../../components/MainCanvas';
import { WorkspaceHeader } from '../../components/WorkspaceHeader';
import { LeftToolbar } from '../../components/Toolbar/LeftToolbar';
import { RightPropertiesPanel } from '../../components/Panels/RightPropertiesPanel';
import { CanvasMinimap } from '../../components/Navigation/CanvasMinimap';
import { ExportBoardModal } from '../../components/Modals/ExportBoardModal';
import { ShortcutsModal } from '../../components/ShortcutsModal';
import { useCanvasHistory } from '../../hooks/useCanvasHistory';
import { Point, ReferenceItem, ToolMode, ViewportTransform } from '../../types/canvas';
import { CropBox } from '../../models/board/Board';
import { clamp, getItemCenter } from '../../utils/math';
import { preloadImages } from '../../utils/imageLoader';
import { UploadCloud } from 'lucide-react';
import { useAppStore } from '../../app/AppState';

export const ReferenceBoardModule: React.FC = () => {
  const { currentProject, currentBoard, updateCurrentBoard } = useAppStore();

  // Convert board elements to ReferenceItem format
  const initialItems: ReferenceItem[] = (currentBoard?.elements || []).map((el) => ({
    id: el.id,
    type: el.type || 'image',
    name: el.name,
    src: el.src || '',
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation,
    opacity: el.opacity,
    zIndex: el.zIndex,
    isLocked: el.isLocked,
    isVisible: el.isVisible !== false,
    isFlippedH: el.isFlippedH,
    isFlippedV: el.isFlippedV,
    aspectRatio: el.aspectRatio,
    groupId: el.groupId,
    crop: el.crop,
    text: el.text,
    fontSize: el.fontSize,
    fontColor: el.fontColor,
    points: el.points,
    strokeWidth: el.strokeWidth,
    strokeColor: el.strokeColor,
    shapeType: el.shapeType,
    shapeColor: el.shapeColor,
  }));

  const [items, setItems] = useState<ReferenceItem[]>(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  // Pencil tool settings
  const [pencilColor, setPencilColor] = useState<string>('#3b82f6');
  const [pencilWidth, setPencilWidth] = useState<number>(4);

  // Eyedropper picked color
  const [pickedColor, setPickedColor] = useState<string | null>(null);

  // In-canvas crop mode
  const [cropItemId, setCropItemId] = useState<string | null>(null);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState<boolean>(false);

  // Initialize transform from currentBoard viewport
  const [transform, setTransform] = useState<ViewportTransform>(() => {
    if (currentBoard?.viewport) {
      return {
        x: currentBoard.viewport.x,
        y: currentBoard.viewport.y,
        scale: currentBoard.viewport.zoom,
      };
    }
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      scale: 0.85,
    };
  });

  const { pushState, undo, redo, canUndo, canRedo } = useCanvasHistory(
    initialItems,
    []
  );

  // Sync when board changes
  useEffect(() => {
    if (currentBoard) {
      const synced: ReferenceItem[] = currentBoard.elements.map((el) => ({
        id: el.id,
        type: el.type || 'image',
        name: el.name,
        src: el.src || '',
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        rotation: el.rotation,
        opacity: el.opacity,
        zIndex: el.zIndex,
        isLocked: el.isLocked,
        isVisible: el.isVisible !== false,
        isFlippedH: el.isFlippedH,
        isFlippedV: el.isFlippedV,
        aspectRatio: el.aspectRatio,
        groupId: el.groupId,
        crop: el.crop,
        gridOverlay: el.gridOverlay,
        text: el.text,
        fontSize: el.fontSize,
        fontColor: el.fontColor,
        points: el.points,
        strokeWidth: el.strokeWidth,
        strokeColor: el.strokeColor,
        shapeType: el.shapeType,
        shapeColor: el.shapeColor,
      }));
      setItems(synced);
      if (currentBoard.viewport) {
        setTransform({
          x: currentBoard.viewport.x,
          y: currentBoard.viewport.y,
          scale: currentBoard.viewport.zoom,
        });
      }
    }
  }, [currentBoard?.id]);

  // Preload images
  useEffect(() => {
    const urls = items.filter((it) => it.type === 'image' && it.src).map((it) => it.src!);
    if (urls.length > 0) {
      preloadImages(urls);
    }
  }, [items]);

  // Persist items to IndexedDB
  const persistBoard = useCallback(
    (newItems: ReferenceItem[], newTf?: ViewportTransform) => {
      updateCurrentBoard((prev) => ({
        ...prev,
        viewport: {
          x: newTf ? newTf.x : transform.x,
          y: newTf ? newTf.y : transform.y,
          zoom: newTf ? newTf.scale : transform.scale,
        },
        elements: newItems.map((it) => ({
          id: it.id,
          type: it.type,
          name: it.name,
          src: it.src,
          x: it.x,
          y: it.y,
          width: it.width,
          height: it.height,
          rotation: it.rotation,
          opacity: it.opacity,
          zIndex: it.zIndex,
          isLocked: it.isLocked,
          isVisible: it.isVisible !== false,
          isFlippedH: it.isFlippedH,
          isFlippedV: it.isFlippedV,
          aspectRatio: it.aspectRatio,
          groupId: it.groupId,
          crop: it.crop,
          gridOverlay: it.gridOverlay,
          text: it.text,
          fontSize: it.fontSize,
          fontColor: it.fontColor,
          points: it.points,
          strokeWidth: it.strokeWidth,
          strokeColor: it.strokeColor,
          shapeType: it.shapeType,
          shapeColor: it.shapeColor,
        })),
      }));
    },
    [updateCurrentBoard, transform]
  );

  const handleUpdateItems = useCallback(
    (newItems: ReferenceItem[], recordHistory = true) => {
      setItems(newItems);
      if (recordHistory) {
        pushState(newItems, selectedIds);
        persistBoard(newItems);
      }
    },
    [pushState, selectedIds, persistBoard]
  );

  const handleUpdateTransform = useCallback(
    (newTf: ViewportTransform) => {
      setTransform(newTf);
      persistBoard(items, newTf);
    },
    [items, persistBoard]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    const prev = undo();
    if (prev) {
      setItems(prev.items);
      setSelectedIds(prev.selectedIds);
      persistBoard(prev.items);
    }
  }, [undo, persistBoard]);

  const handleRedo = useCallback(() => {
    const next = redo();
    if (next) {
      setItems(next.items);
      setSelectedIds(next.selectedIds);
      persistBoard(next.items);
    }
  }, [redo, persistBoard]);

  // Zoom helpers
  const handleZoomIn = useCallback(() => {
    setTransform((prev) => {
      const newScale = clamp(prev.scale * 1.25, 0.05, 8.0);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const worldCenterX = (width / 2 - prev.x) / prev.scale;
      const worldCenterY = (height / 2 - prev.y) / prev.scale;
      const nextTf = {
        x: width / 2 - worldCenterX * newScale,
        y: height / 2 - worldCenterY * newScale,
        scale: newScale,
      };
      persistBoard(items, nextTf);
      return nextTf;
    });
  }, [items, persistBoard]);

  const handleZoomOut = useCallback(() => {
    setTransform((prev) => {
      const newScale = clamp(prev.scale * 0.8, 0.05, 8.0);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const worldCenterX = (width / 2 - prev.x) / prev.scale;
      const worldCenterY = (height / 2 - prev.y) / prev.scale;
      const nextTf = {
        x: width / 2 - worldCenterX * newScale,
        y: height / 2 - worldCenterY * newScale,
        scale: newScale,
      };
      persistBoard(items, nextTf);
      return nextTf;
    });
  }, [items, persistBoard]);

  const handleResetZoom = useCallback(() => {
    setTransform((prev) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const worldCenterX = (width / 2 - prev.x) / prev.scale;
      const worldCenterY = (height / 2 - prev.y) / prev.scale;
      const nextTf = {
        x: width / 2 - worldCenterX * 1.0,
        y: height / 2 - worldCenterY * 1.0,
        scale: 1.0,
      };
      persistBoard(items, nextTf);
      return nextTf;
    });
  }, [items, persistBoard]);

  // Frame / Fit all
  const handleFitAll = useCallback(() => {
    if (items.length === 0) {
      const defaultTf = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        scale: 1.0,
      };
      setTransform(defaultTf);
      persistBoard(items, defaultTf);
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    items.forEach((it) => {
      if (it.isVisible !== false) {
        minX = Math.min(minX, it.x);
        minY = Math.min(minY, it.y);
        maxX = Math.max(maxX, it.x + it.width);
        maxY = Math.max(maxY, it.y + it.height);
      }
    });

    const boundsW = maxX - minX;
    const boundsH = maxY - minY;
    const boundsCenterX = (minX + maxX) / 2;
    const boundsCenterY = (minY + maxY) / 2;

    const padding = 120;
    const availableW = Math.max(window.innerWidth - padding * 2, 200);
    const availableH = Math.max(window.innerHeight - padding * 2, 200);

    const fitScale = clamp(
      Math.min(availableW / boundsW, availableH / boundsH),
      0.1,
      2.0
    );

    const nextTf = {
      x: window.innerWidth / 2 - boundsCenterX * fitScale,
      y: window.innerHeight / 2 - boundsCenterY * fitScale,
      scale: fitScale,
    };
    setTransform(nextTf);
    persistBoard(items, nextTf);
  }, [items, persistBoard]);

  // Import images
  const handleImportImages = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) return;

      const viewportCenterX = (window.innerWidth / 2 - transform.x) / transform.scale;
      const viewportCenterY = (window.innerHeight / 2 - transform.y) / transform.scale;
      const currentMaxZ = items.reduce((max, it) => Math.max(max, it.zIndex), 0);

      const promises = files.map((file, idx) => {
        return new Promise<ReferenceItem>((resolve) => {
          const objectUrl = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            const aspect = img.naturalWidth / img.naturalHeight;
            let targetW = Math.min(420, img.naturalWidth);
            let targetH = targetW / aspect;

            const newItem: ReferenceItem = {
              id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'image',
              name: file.name.replace(/\.[^/.]+$/, ''),
              src: objectUrl,
              x: viewportCenterX - targetW / 2 + idx * 36,
              y: viewportCenterY - targetH / 2 + idx * 36,
              width: targetW,
              height: targetH,
              rotation: 0,
              opacity: 1,
              zIndex: currentMaxZ + idx + 1,
              isLocked: false,
              isVisible: true,
              isFlippedH: false,
              isFlippedV: false,
              aspectRatio: aspect,
            };
            resolve(newItem);
          };
          img.onerror = () => {
            resolve({
              id: `imported-fallback-${Date.now()}-${idx}`,
              type: 'image',
              name: file.name,
              src: objectUrl,
              x: viewportCenterX + idx * 30,
              y: viewportCenterY + idx * 30,
              width: 320,
              height: 240,
              rotation: 0,
              opacity: 1,
              zIndex: currentMaxZ + idx + 1,
              isLocked: false,
              isVisible: true,
              isFlippedH: false,
              isFlippedV: false,
              aspectRatio: 320 / 240,
            });
          };
          img.src = objectUrl;
        });
      });

      Promise.all(promises).then((newItems) => {
        const combined = [...items, ...newItems];
        setItems(combined);
        const lastId = newItems[newItems.length - 1]?.id;
        const newSel = lastId ? [lastId] : [];
        setSelectedIds(newSel);
        pushState(combined, newSel);
        persistBoard(combined);
      });
    },
    [items, transform, pushState, persistBoard]
  );

  // Text Note creation
  const handleCreateText = useCallback(
    (worldPt: Point) => {
      const textId = `text-${Date.now()}`;
      const defaultText = prompt('Enter reference text note:') || 'Reference Note';
      if (!defaultText.trim()) return;

      const newItem: ReferenceItem = {
        id: textId,
        type: 'text',
        name: 'Text Annotation',
        x: worldPt.x,
        y: worldPt.y,
        width: 220,
        height: 80,
        rotation: 0,
        opacity: 1,
        zIndex: items.length + 1,
        isLocked: false,
        isVisible: true,
        isFlippedH: false,
        isFlippedV: false,
        aspectRatio: 220 / 80,
        text: defaultText,
        fontSize: 16,
        fontColor: '#ffffff',
      };

      const updated = [...items, newItem];
      setItems(updated);
      setSelectedIds([textId]);
      pushState(updated, [textId]);
      persistBoard(updated);
      setToolMode('select');
    },
    [items, pushState, persistBoard]
  );

  // Shape creation
  const handleCreateShape = useCallback(
    (worldPt: Point) => {
      const shapeId = `shape-${Date.now()}`;
      const newItem: ReferenceItem = {
        id: shapeId,
        type: 'shape',
        name: 'Callout Frame',
        x: worldPt.x,
        y: worldPt.y,
        width: 180,
        height: 140,
        rotation: 0,
        opacity: 1,
        zIndex: items.length + 1,
        isLocked: false,
        isVisible: true,
        isFlippedH: false,
        isFlippedV: false,
        aspectRatio: 180 / 140,
        shapeType: 'rectangle',
        shapeColor: '#3b82f6',
      };

      const updated = [...items, newItem];
      setItems(updated);
      setSelectedIds([shapeId]);
      pushState(updated, [shapeId]);
      persistBoard(updated);
      setToolMode('select');
    },
    [items, pushState, persistBoard]
  );

  // Selected items properties operations
  const selectedItems = items.filter((it) => selectedIds.includes(it.id));

  const handleUpdateItem = useCallback(
    (id: string, updates: Partial<ReferenceItem>) => {
      const updated = items.map((it) => (it.id === id ? { ...it, ...updates } : it));
      handleUpdateItems(updated, true);
    },
    [items, handleUpdateItems]
  );

  const handleUpdateAllSelected = useCallback(
    (updates: Partial<ReferenceItem>) => {
      if (selectedIds.length === 0) return;
      const updated = items.map((it) =>
        selectedIds.includes(it.id) ? { ...it, ...updates } : it
      );
      handleUpdateItems(updated, true);
    },
    [selectedIds, items, handleUpdateItems]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const filtered = items.filter((it) => !selectedIds.includes(it.id));
    setItems(filtered);
    setSelectedIds([]);
    pushState(filtered, []);
    persistBoard(filtered);
  }, [selectedIds, items, pushState, persistBoard]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedItems.length === 0) return;
    const currentMaxZ = items.reduce((max, it) => Math.max(max, it.zIndex), 0);
    const newItems: ReferenceItem[] = selectedItems.map((it, idx) => ({
      ...it,
      id: `copy-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${it.name} (Copy)`,
      x: it.x + 36,
      y: it.y + 36,
      zIndex: currentMaxZ + idx + 1,
    }));
    const combined = [...items, ...newItems];
    setItems(combined);
    const newSel = newItems.map((n) => n.id);
    setSelectedIds(newSel);
    pushState(combined, newSel);
    persistBoard(combined);
  }, [selectedItems, items, pushState, persistBoard]);

  // Layer ordering
  const handleBringToFront = useCallback(() => {
    if (selectedIds.length === 0) return;
    const maxZ = items.reduce((max, it) => Math.max(max, it.zIndex), 0);
    const updated = items.map((it) =>
      selectedIds.includes(it.id) ? { ...it, zIndex: maxZ + 1 } : it
    );
    handleUpdateItems(updated, true);
  }, [selectedIds, items, handleUpdateItems]);

  const handleSendToBack = useCallback(() => {
    if (selectedIds.length === 0) return;
    const minZ = items.reduce((min, it) => Math.min(min, it.zIndex), 0);
    const updated = items.map((it) =>
      selectedIds.includes(it.id) ? { ...it, zIndex: minZ - 1 } : it
    );
    handleUpdateItems(updated, true);
  }, [selectedIds, items, handleUpdateItems]);

  const handleBringForward = useCallback(() => {
    if (selectedIds.length === 0) return;
    const updated = items.map((it) =>
      selectedIds.includes(it.id) ? { ...it, zIndex: it.zIndex + 1 } : it
    );
    handleUpdateItems(updated, true);
  }, [selectedIds, items, handleUpdateItems]);

  const handleSendBackward = useCallback(() => {
    if (selectedIds.length === 0) return;
    const updated = items.map((it) =>
      selectedIds.includes(it.id) ? { ...it, zIndex: it.zIndex - 1 } : it
    );
    handleUpdateItems(updated, true);
  }, [selectedIds, items, handleUpdateItems]);

  const handleResetTransform = useCallback(() => {
    if (selectedItems.length === 0) return;
    const updated = items.map((it) => {
      if (selectedIds.includes(it.id)) {
        const center = getItemCenter(it);
        const defaultW = 380;
        const defaultH = defaultW / (it.aspectRatio || 1);
        return {
          ...it,
          rotation: 0,
          isFlippedH: false,
          isFlippedV: false,
          width: defaultW,
          height: defaultH,
          x: center.x - defaultW / 2,
          y: center.y - defaultH / 2,
        };
      }
      return it;
    });
    handleUpdateItems(updated, true);
  }, [selectedItems, selectedIds, items, handleUpdateItems]);

  // Grouping
  const handleGroupSelected = useCallback(() => {
    if (selectedIds.length <= 1) return;
    const newGroupId = `group-${Date.now()}`;
    const updated = items.map((it) =>
      selectedIds.includes(it.id) ? { ...it, groupId: newGroupId } : it
    );
    handleUpdateItems(updated, true);
  }, [selectedIds, items, handleUpdateItems]);

  const handleUngroupSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const updated = items.map((it) =>
      selectedIds.includes(it.id) ? { ...it, groupId: undefined } : it
    );
    handleUpdateItems(updated, true);
  }, [selectedIds, items, handleUpdateItems]);

  // Crop mode
  const handleStartCrop = useCallback(() => {
    if (selectedIds.length === 1) {
      setCropItemId(selectedIds[0]);
    }
  }, [selectedIds]);

  const handleApplyCrop = useCallback(
    (itemId: string, newCrop: CropBox) => {
      const updated = items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              crop: newCrop,
            }
          : it
      );
      handleUpdateItems(updated, true);
      setCropItemId(null);
    },
    [items, handleUpdateItems]
  );

  const handleCancelCrop = useCallback(() => {
    setCropItemId(null);
  }, []);

  // Drag and drop onto window
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFiles(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFiles(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImportImages(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex flex-col flex-1 w-full h-full overflow-hidden bg-[#121316] text-slate-100 select-none font-sans"
    >
      {/* Top Header Bar */}
      <WorkspaceHeader
        boardTitle={currentBoard?.name || 'Main Reference Board'}
        itemCount={items.length}
        transform={transform}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitAll={handleFitAll}
        onImportImages={handleImportImages}
        onToggleShortcuts={() => setIsShortcutsOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Main 2D Canvas Workspace */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <MainCanvas
          items={items}
          selectedIds={selectedIds}
          toolMode={toolMode}
          transform={transform}
          cropItemId={cropItemId}
          pencilColor={pencilColor}
          pencilWidth={pencilWidth}
          onSelect={setSelectedIds}
          onUpdateItems={handleUpdateItems}
          onUpdateTransform={handleUpdateTransform}
          onApplyCrop={handleApplyCrop}
          onCancelCrop={handleCancelCrop}
          onPickColor={(hex) => {
            setPickedColor(hex);
            setPencilColor(hex);
          }}
          onCreateText={handleCreateText}
          onCreateShape={handleCreateShape}
        />

        {/* Left Vertical Toolbar */}
        <LeftToolbar
          toolMode={toolMode}
          onSetToolMode={setToolMode}
          onTriggerImport={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/png, image/jpeg, image/webp';
            input.multiple = true;
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files) handleImportImages(target.files);
            };
            input.click();
          }}
          pencilColor={pencilColor}
          pencilWidth={pencilWidth}
          onSetPencilColor={setPencilColor}
          onSetPencilWidth={setPencilWidth}
          pickedColor={pickedColor}
        />

        {/* Right Properties Inspector */}
        {selectedItems.length > 0 && !cropItemId && (
          <RightPropertiesPanel
            selectedItems={selectedItems}
            onUpdateItem={handleUpdateItem}
            onUpdateAllSelected={handleUpdateAllSelected}
            onDuplicate={handleDuplicateSelected}
            onDelete={handleDeleteSelected}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onResetTransform={handleResetTransform}
            onStartCrop={handleStartCrop}
            onGroupSelected={handleGroupSelected}
            onUngroupSelected={handleUngroupSelected}
            onClose={() => setSelectedIds([])}
          />
        )}

        {/* Bottom-Right Minimap Radar Widget */}
        <CanvasMinimap
          items={items}
          transform={transform}
          onNavigate={handleUpdateTransform}
        />

        {/* Drag-and-drop overlay */}
        {isDraggingFiles && (
          <div className="pointer-events-none absolute inset-0 z-40 bg-blue-600/20 backdrop-blur-sm border-2 border-dashed border-blue-400 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-100">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-base font-medium text-white shadow-sm">
              Drop reference images here to add to board
            </p>
          </div>
        )}
      </main>

      {/* Export Modal */}
      <ExportBoardModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={items}
        transform={transform}
      />

      {/* Navigation & Shortcuts Cheatsheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
