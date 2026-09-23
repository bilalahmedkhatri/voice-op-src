import React from 'react';
import { FiCheck, FiRefreshCw } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

interface StatusSectionProps {
  item: any;
  itemType: "short" | "long_video" | null;
  handleStatusChange: (status: string) => void;
  isSaving: boolean;
  saveSuccess: boolean;
}

export default function StatusSection({ item, itemType, handleStatusChange, isSaving, saveSuccess }: StatusSectionProps) {
  return (
    <Card>
      <SectionHeader title="Status" />
      <div className="flex flex-col gap-3">
        <select
          value={item.status || "pending"}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isSaving}
          className={`text-sm font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full cursor-pointer shadow-sm disabled:opacity-50 ${itemType === 'short' ? 'bg-red-50' : 'bg-purple-50'}`}
        >
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
          <option value="published">Published</option>
        </select>
        {isSaving && <span className="text-xs text-blue-600 flex items-center gap-1"><FiRefreshCw className="w-3 h-3 animate-spin" /> Updating status...</span>}
        {saveSuccess && <span className="text-xs text-green-600 flex items-center gap-1"><FiCheck className="w-3 h-3" /> Status updated!</span>}
      </div>
    </Card>
  );
}
