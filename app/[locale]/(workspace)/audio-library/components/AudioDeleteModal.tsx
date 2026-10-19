'use client';

import {errorCopy} from '@/i18n/errors';

import {useCopy} from '@/i18n/copy';

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
  const copy = useCopy();


  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={count === 1 ? copy("Delete Audio Track") : copy("Delete {v0} Audio Tracks", {v0: count})}
      message={copy('{v0, plural, one {Are you sure you want to delete this audio track? This action cannot be undone.} other {Are you sure you want to delete these # audio tracks? This action cannot be undone.}}', {v0: count})}
      confirmText={copy("Delete")}
      isLoading={isDeleting}
      error={errorCopy(error, copy)}
    />
  );
}
