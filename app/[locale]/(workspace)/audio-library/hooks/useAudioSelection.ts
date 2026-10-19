'use client';

import { useState, useCallback } from 'react';

export function useAudioSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback((allIds: string[]) => {
    setSelectedIds((prev) =>
      allIds.every(id => prev.includes(id)) ? prev.filter(id => !allIds.includes(id)) : [...new Set([...prev, ...allIds])]
    );
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    isSelected,
    clearSelection,
  };
}
