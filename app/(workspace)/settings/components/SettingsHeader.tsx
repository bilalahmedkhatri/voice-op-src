import React from "react";
import { FiRefreshCw } from "react-icons/fi";

interface SettingsHeaderProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export default function SettingsHeader({ onRefresh, isLoading }: SettingsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Settings</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile identity, quota limits, and system usage.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          title="Refresh status"
        >
          <FiRefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
