import React from "react";
import Button from "@/components/ui/Button";

interface SettingsHeaderProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export default function SettingsHeader({ onRefresh, isLoading }: SettingsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Settings</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile identity, quota limits, and system usage.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          onClick={onRefresh}
          isLoading={isLoading}
          variant="secondary"
          size="md"
          title="Refresh status"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
