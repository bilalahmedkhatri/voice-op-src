export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '-';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}s`;
}

export function formatFileSize(sizeOrBytes?: number | string | null): string {
  if (sizeOrBytes === null || sizeOrBytes === undefined || sizeOrBytes === '') return '-';
  const bytes = typeof sizeOrBytes === 'string' ? parseFloat(sizeOrBytes) : sizeOrBytes;
  if (!bytes || isNaN(bytes) || bytes <= 0) return '-';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function formatDate(dateStr: string | null | undefined, locale = 'en'): string {
  if (!dateStr || dateStr.startsWith('1970')) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return 'Recent';
    return d.toLocaleDateString(locale === 'pt' ? 'pt-PT' : locale, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

export function downloadAudio(url: string, filename: string) {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
