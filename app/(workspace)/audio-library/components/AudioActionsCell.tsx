'use client';

import React from 'react';
import { FiDownload, FiLink, FiTrash2 } from 'react-icons/fi';
import IconButton from '@/components/ui/IconButton';

interface Props {
  id: string;
  onDownload: () => void;
  onCopy: () => void;
  onDelete: (id: string) => void;
}

export default function AudioActionsCell({ id, onDownload, onCopy, onDelete }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <IconButton icon={<FiDownload className="w-3.5 h-3.5" />} title="Download" size="sm" variant="secondary" onClick={onDownload} />
      <IconButton icon={<FiLink className="w-3.5 h-3.5" />} title="Copy Link" size="sm" variant="secondary" onClick={onCopy} />
      <IconButton icon={<FiTrash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />} title="Delete" size="sm" variant="secondary" onClick={() => onDelete(id)} />
    </div>
  );
}
