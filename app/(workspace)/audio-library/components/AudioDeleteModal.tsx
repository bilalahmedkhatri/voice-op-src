'use client';

import React from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface AudioDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  error?: string | null;
  count?: number;
}

export default function AudioDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  error,
  count = 1,
}: AudioDeleteModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={count === 1 ? 'Delete Audio Track' : `Delete ${count} Audio Tracks`}
      message={`Are you sure you want to delete ${count === 1 ? 'this audio track' : `these ${count} audio tracks`}? This action cannot be undone.`}
      confirmText="Delete"
      isLoading={isDeleting}
      error={error}
    />
  );
}
