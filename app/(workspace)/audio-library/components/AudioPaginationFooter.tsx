'use client';

import React from 'react';
import Pagination from '@/components/ui/Pagination';

interface AudioPaginationFooterProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
}

export default function AudioPaginationFooter({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: AudioPaginationFooterProps) {
  if (total === 0) return null;

  return (
    <div className="pt-2">
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
