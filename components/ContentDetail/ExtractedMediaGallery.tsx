import React, { useState } from 'react';
import { FiImage, FiDownloadCloud, FiTrash2, FiVideo, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui';

interface ExtractedMediaGalleryProps {
  signedMediaUrls: string[];
  selectedMediaUrls: string[];
  setSelectedMediaUrls: React.Dispatch<React.SetStateAction<string[]>>;
  isDeleting: boolean;
  handleDeleteMedia: (urls: string[]) => void;
  setPreviewMediaUrl: (url: string | null) => void;
  isDownloadingBulk: boolean;
  setIsDownloadingBulk: React.Dispatch<React.SetStateAction<boolean>>;
  downloadProgress: number;
  setDownloadProgress: React.Dispatch<React.SetStateAction<number>>;
}

export default function ExtractedMediaGallery({
  signedMediaUrls,
  selectedMediaUrls,
  setSelectedMediaUrls,
  isDeleting,
  handleDeleteMedia,
  setPreviewMediaUrl,
  isDownloadingBulk,
  setIsDownloadingBulk,
  downloadProgress,
  setDownloadProgress
}: ExtractedMediaGalleryProps) {

  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', isError: false });

  const handleDownloadSelected = async () => {
    if (selectedMediaUrls.length === 0) return;

    let dirHandle: any = null;

    // Try using the File System Access API
    if ('showDirectoryPicker' in window) {
      try {
        dirHandle = await (window as any).showDirectoryPicker({
          id: 'bulk-media-download',
          mode: 'readwrite'
        });
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn("Directory picker failed, falling back:", err);
      }
    } else {
      alert("Folder selection not supported. Videos will be saved to your default 'Downloads' folder.");
    }

    setIsDownloadingBulk(true);
    setDownloadProgress(0);
    let savedCount = 0;

    for (let i = 0; i < selectedMediaUrls.length; i++) {
      const url = selectedMediaUrls[i];
      try {
        // Use Next.js API proxy instead of direct fetch to avoid CORS and hide endpoints
        const response = await fetch(`/api/media/download?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const blob = await response.blob();

        const isVideo = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.webm');
        const ext = isVideo ? 'mp4' : 'jpg';
        const filename = `media_${i + 1}_${Date.now()}.${ext}`;

        if (dirHandle) {
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          savedCount++;
        } else {
          // Fallback to default downloads
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          savedCount++;
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        }
      } catch (err) {
        console.error(`Failed to download ${url}:`, err);
      }
      setDownloadProgress(i + 1);
    }

    setIsDownloadingBulk(false);

    if (savedCount > 0) {
      if (dirHandle) {
        setTimeout(() => setAlertConfig({ isOpen: true, title: "Download Complete", message: `Successfully saved ${savedCount} items to your folder!`, isError: false }), 300);
      } else {
        setTimeout(() => setAlertConfig({ isOpen: true, title: "Download Complete", message: `${savedCount} items downloaded to default Downloads.`, isError: false }), 300);
      }
    } else {
      setTimeout(() => setAlertConfig({ isOpen: true, title: "Download Failed", message: `Failed to download items. Please check the console for details.`, isError: true }), 300);
    }
  };

  if (signedMediaUrls.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden mt-6">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FiImage className="w-5 h-5 text-[#ff7d6e]" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Extracted Media Gallery</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") return;
              if (val === "clear") {
                setSelectedMediaUrls([]);
              } else if (val === "all") {
                setSelectedMediaUrls([...signedMediaUrls]);
              } else {
                const count = parseInt(val, 10);
                setSelectedMediaUrls(signedMediaUrls.slice(0, count));
              }
              e.target.value = "";
            }}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] cursor-pointer shadow-xs bg-white"
            defaultValue=""
          >
            <option value="" disabled>Select Multiple...</option>
            <option value="10">Select First 10</option>
            <option value="20">Select First 20</option>
            <option value="30">Select First 30</option>
            <option value="all">Select All</option>
            <option value="clear">Clear Selection</option>
          </select>

          {selectedMediaUrls.length > 0 && (
            <>
              <Button
                onClick={handleDownloadSelected}
                disabled={isDownloadingBulk || isDeleting}
                isLoading={isDownloadingBulk}
                size="sm"
                variant="soft"
                icon={<FiDownloadCloud className="w-3.5 h-3.5" />}
              >
                {isDownloadingBulk ? `Downloading ${downloadProgress}/${selectedMediaUrls.length}...` : `Download Selected (${selectedMediaUrls.length})`}
              </Button>
              <Button
                onClick={() => handleDeleteMedia(selectedMediaUrls)}
                disabled={isDeleting || isDownloadingBulk}
                isLoading={isDeleting}
                size="sm"
                variant="dangerSoft"
                icon={<FiTrash2 className="w-3.5 h-3.5" />}
              >
                {isDeleting ? 'Deleting...' : `Delete Selected (${selectedMediaUrls.length})`}
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 p-3">
        {signedMediaUrls.map((url, idx) => {
          const isVideo = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.webm');
          const isSelected = selectedMediaUrls.includes(url);
          return (
            <div
              key={idx}
              className={`relative w-full break-inside-avoid mb-3 rounded-xl overflow-hidden border transition-all ${isSelected ? 'border-[#ff7d6e] ring-2 ring-[#ff7d6e]/30' : 'border-slate-200/70 bg-slate-50 hover:border-slate-300'} group cursor-pointer`}
              onClick={() => setPreviewMediaUrl(url)}
            >
              {isVideo ? (
                <>
                  <video
                    src={url}
                    controls
                    controlsList="nodownload"
                    preload="none"
                    className="w-full h-auto block"
                  />
                  {/* Invisible overlay to capture clicks for the popup */}
                  <div className="absolute inset-0 z-[5] bg-transparent" />
                  <div className="absolute top-2 right-2 bg-black/50 p-1 rounded backdrop-blur-sm z-10 pointer-events-none">
                    <FiVideo className="w-3 h-3 text-white" />
                  </div>
                </>
              ) : (
                <img src={url} alt={`Media ${idx}`} className="w-full h-auto block transition-transform duration-300 group-hover:scale-105 pointer-events-none" />
              )}

              {/* Selection Checkbox */}
              <div
                className={`absolute top-2 left-2 transition-opacity z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedMediaUrls(prev => [...prev, url]);
                    else setSelectedMediaUrls(prev => prev.filter(u => u !== url));
                  }}
                  className="w-4 h-4 cursor-pointer accent-[#ff7d6e] bg-white rounded-sm"
                />
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        isAlert={true}
        icon={alertConfig.isError ? <FiAlertTriangle className="w-5 h-5" /> : <FiCheckCircle className="w-5 h-5" />}
      />
    </div>
  );
}
