
import {useCopy} from '@/i18n/copy';
import WorkspacePageHeader from "@/app/components/workspace/WorkspacePageHeader";
import IconButton from "@/components/ui/IconButton";

export default function SettingsHeader({ onRefresh, isLoading }: { onRefresh: () => void; isLoading?: boolean }) {
  const copy = useCopy();


  return <WorkspacePageHeader actions={<IconButton title={copy("Refresh status")} onClick={onRefresh} isLoading={isLoading} variant="secondary" size="md" />} />;
}
