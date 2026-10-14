import WorkspacePageHeader from "@/app/components/workspace/WorkspacePageHeader";
import IconButton from "@/components/ui/IconButton";

export default function SettingsHeader({ onRefresh, isLoading }: { onRefresh: () => void; isLoading?: boolean }) {
  return <WorkspacePageHeader actions={<IconButton title="Refresh status" onClick={onRefresh} isLoading={isLoading} variant="secondary" size="md" />} />;
}
