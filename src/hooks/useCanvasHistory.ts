import { useCallback, useRef, useState } from 'react';
import { HistoryEntry, ReferenceItem } from '../types/canvas';

const MAX_HISTORY = 40;

export function useCanvasHistory(initialItems: ReferenceItem[], initialSelectedIds: string[] = []) {
  const historyRef = useRef<HistoryEntry[]>([
    {
      items: JSON.parse(JSON.stringify(initialItems)),
      selectedIds: [...initialSelectedIds],
    },
  ]);
  const indexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < historyRef.current.length - 1);
  }, []);

  const pushState = useCallback((items: ReferenceItem[], selectedIds: string[]) => {
    const nextEntry: HistoryEntry = {
      items: JSON.parse(JSON.stringify(items)),
      selectedIds: [...selectedIds],
    };

    // If head is not at end, drop future entries
    const sliced = historyRef.current.slice(0, indexRef.current + 1);
    sliced.push(nextEntry);

    // Limit maximum depth
    if (sliced.length > MAX_HISTORY) {
      sliced.shift();
    }

    historyRef.current = sliced;
    indexRef.current = sliced.length - 1;
    updateFlags();
  }, [updateFlags]);

  const undo = useCallback((): HistoryEntry | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current -= 1;
    updateFlags();
    const entry = historyRef.current[indexRef.current];
    return {
      items: JSON.parse(JSON.stringify(entry.items)),
      selectedIds: [...entry.selectedIds],
    };
  }, [updateFlags]);

  const redo = useCallback((): HistoryEntry | null => {
    if (indexRef.current >= historyRef.current.length - 1) return null;
    indexRef.current += 1;
    updateFlags();
    const entry = historyRef.current[indexRef.current];
    return {
      items: JSON.parse(JSON.stringify(entry.items)),
      selectedIds: [...entry.selectedIds],
    };
  }, [updateFlags]);

  const resetHistory = useCallback((items: ReferenceItem[], selectedIds: string[] = []) => {
    historyRef.current = [
      {
        items: JSON.parse(JSON.stringify(items)),
        selectedIds: [...selectedIds],
      },
    ];
    indexRef.current = 0;
    updateFlags();
  }, [updateFlags]);

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
