'use client';

import {useCopy} from '@/i18n/copy';

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
  const copy = useCopy();


  return (
    <div className="flex items-center gap-1.5">
      <IconButton icon={<FiDownload className="w-3.5 h-3.5" />} title={copy("Download")} size="sm" variant="secondary" onClick={onDownload} />
      <IconButton icon={<FiLink className="w-3.5 h-3.5" />} title={copy("Copy Link")} size="sm" variant="secondary" onClick={onCopy} />
      <IconButton icon={<FiTrash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />} title={copy("Delete")} size="sm" variant="secondary" onClick={() => onDelete(id)} />
    </div>
  );
}
