import React from 'react';
import { FiExternalLink } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

interface MediaVisualAssetsSectionProps {
  extraDataMedia: any[];
}

export default function MediaVisualAssetsSection({ extraDataMedia }: MediaVisualAssetsSectionProps) {
  const renderValue = (val: any, keyPath: string): React.ReactNode => {
    if (typeof val === 'string' && val.match(/^https?:\/\//)) {
      return (
        <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap">
          {val} <FiExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      );
    }
    if (val && typeof val === 'object' && !Array.isArray(val) && (val.source_url !== undefined || val.keyword !== undefined)) {
      return (
        <div className="p-3 bg-white border-t border-slate-200 flex-1 flex flex-col justify-between">
          <a href={val.source_url || '#'} target={val.source_url ? "_blank" : "_self"} rel="noopener noreferrer" className={`text-[11px] ${val.source_url ? 'text-blue-600 hover:underline' : 'text-slate-600 font-medium'} truncate w-full block mb-2`} title={val.source_url || val.keyword}>
            {val.source_url || `Search: ${val.keyword}` || 'Downloaded Media'}
          </a>
        </div>
      );
    }
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return <span>{String(val)}</span>;
    }
    if (Array.isArray(val)) {
      return (
        <ul className="list-disc pl-5 space-y-1 mt-1">
          {val.map((item, idx) => (
            <li key={`${keyPath}-${idx}`}>{renderValue(item, `${keyPath}-${idx}`)}</li>
          ))}
        </ul>
      );
    }
    if (typeof val === 'object' && val !== null) {
      return (
        <div className="pl-4 border-l-2 border-slate-200 mt-1 space-y-2">
          {Object.entries(val).map(([k, v]) => (
            <div key={`${keyPath}-${k}`}>
              <span className="font-semibold text-slate-700 capitalize">{k.replace(/_/g, ' ')}:</span> {renderValue(v, `${keyPath}-${k}`)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!extraDataMedia || extraDataMedia.length === 0 || extraDataMedia.every(d => !d)) {
    return null;
  }

  return (
    <Card>
      <SectionHeader title="Media & Visual Assets" />
      <div className="bg-slate-50 p-4 sm:p-5 rounded-lg border border-slate-100 max-h-96 overflow-y-auto overflow-x-auto text-sm text-slate-700 w-full">
        {extraDataMedia.map((data, idx) => (
          <div key={idx} className="mb-4 last:mb-0">
            {renderValue(data, `MediaVisualAssets-${idx}`)}
          </div>
        ))}
      </div>
    </Card>
  );
}
