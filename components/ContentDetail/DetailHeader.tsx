import WorkspacePageHeader from "@/app/components/workspace/WorkspacePageHeader";
import React from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiYoutube, FiVideo } from 'react-icons/fi';

interface DetailHeaderProps {
  templateId: string | null;
  backUrl?: string;
  backText?: string;
  itemType: "short" | "long_video" | null;
  item: any;
  handleSendToVoice: (text: string, type: "short" | "long_video" | null, title: string) => void;
  copiedId: string | null;
  handleCopy: (text: string, id: string) => void;
}

export default function DetailHeader({
  templateId,
  backUrl,
  backText,
  itemType,
  item,
}: DetailHeaderProps) {
  const returnHref = backUrl || (templateId ? `/youtube/content?id=${templateId}` : `/content?id=${templateId}`);
  return <WorkspacePageHeader title={item.title || "Untitled Video"}
    icon={itemType === "long_video" ? <FiYoutube /> : <FiVideo />}
    description={itemType === "long_video" ? "Long Video" : "Short Video"}
    breadcrumbs={<Link href={returnHref} className="inline-flex items-center gap-2 text-sm text-[#c83a2a] hover:underline font-semibold">
      <FiArrowLeft /> {backText || "Back to YouTube Strategy"}
    </Link>} />;
}
