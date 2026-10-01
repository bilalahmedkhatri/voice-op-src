import React from "react";
import { FiVideo, FiDownloadCloud, FiX } from "react-icons/fi";
import { IconButton } from "@/components/ui";

interface PreviewModalProps {
  previewMediaUrl: string | null;
  setPreviewMediaUrl: (url: string | null) => void;
}

export default function PreviewModal({ previewMediaUrl, setPreviewMediaUrl }: PreviewModalProps) {
  if (!previewMediaUrl) return null;

  const handleSingleDownload = async (url: string) => {
    try {
      // Use the proxy instead of direct fetching
      const response = await fetch(`/api/media/download?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      
      const isVideo = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.webm');
      const ext = isVideo ? 'mp4' : 'jpg';
      const defaultFilename = `extracted_media_${Date.now()}.${ext}`;

      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: defaultFilename,
            types: [{
              description: isVideo ? 'Video File' : 'Image File',
              accept: isVideo ? { 'video/mp4': ['.mp4'] } : { 'image/jpeg': ['.jpg', '.jpeg'] },
            }],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return; // Success
        } catch (err: any) {
          if (err.name === 'AbortError') return; // User cancelled
          console.warn("Save file picker failed, falling back to traditional download:", err);
        }
      }
      
      // Fallback
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      
    } catch (err) {
      console.error(`Failed to download ${url}:`, err);
      alert("Failed to download the file. It might be due to a network error.");
    }
  };

  const isVideoUrl = previewMediaUrl.toLowerCase().includes('.mp4') || previewMediaUrl.toLowerCase().includes('.webm');

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 p-4 sm:p-8 backdrop-blur-sm transition-opacity duration-300"
      onClick={() => setPreviewMediaUrl(null)}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 text-sm font-semibold flex items-center gap-2">
              <FiVideo className="w-4 h-4 text-[#ff7d6e]" /> Media Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              icon={<FiDownloadCloud className="w-4 h-4" />}
              title="Download File"
              size="sm"
              variant="ghost"
              onClick={() => handleSingleDownload(previewMediaUrl)}
            />
            <IconButton
              icon={<FiX className="w-4 h-4" />}
              title="Close (Esc)"
              size="sm"
              variant="ghost"
              onClick={() => setPreviewMediaUrl(null)}
              className="hover:text-red-500 hover:bg-red-50"
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex items-center justify-center w-full bg-slate-100 min-h-[40vh] max-h-[85vh] p-2 sm:p-4">
          {isVideoUrl ? (
            <video
              src={previewMediaUrl}
              controls
              autoPlay
              controlsList="nodownload"
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-sm"
            />
          ) : (
            <img
              src={previewMediaUrl}
              alt="Preview"
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
