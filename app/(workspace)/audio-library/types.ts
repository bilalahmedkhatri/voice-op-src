export interface AudioItem {
  id: string;
  user_id: string;
  prompt_text: string;
  model_id: string;
  model_name: string;
  voice_id: string;
  voice_name: string;
  audio_url: string;
  duration_sec: number | null;
  generation_time_sec: number | null;
  parameters: Record<string, any>;
  created_at: string;
  filename?: string;
  size_bytes?: number;
}

export interface AudioLibraryApiResponse {
  authenticated: boolean;
  items: AudioItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AudioLibraryContentProps {
  items: AudioItem[];
  playingId: string | null;
  loadingId?: string | null;
  selectedIds: string[];
  authenticated: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  modelFilter: string;
  onModelFilterChange: (val: string) => void;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onTogglePlay: (id: string, url: string) => void;
  onDelete: (id: string) => void;
  onCopy: (url: string) => void;
  onDownload: (item: AudioItem) => void;
}
