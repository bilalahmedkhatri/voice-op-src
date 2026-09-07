'use client';

export interface LocalHistoryItem {
  id: string;
  prompt_text: string;
  model_id: string;
  model_name: string;
  voice_id: string;
  voice_name: string;
  audioBlob: Blob;
  audio_url?: string;
  duration_sec?: number | null;
  generation_time_sec?: number | null;
  parameters?: Record<string, any>;
  created_at: string;
}

const DB_NAME = 'VoiceGeneratorDB';
const DB_VERSION = 1;
const STORE_NAME = 'history';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalHistoryItem(
  item: Omit<LocalHistoryItem, 'id' | 'created_at'>
): Promise<LocalHistoryItem> {
  const db = await openDB();
  const id = `loc_${crypto.randomUUID().replace(/-/g, '')}`;
  const newItem: LocalHistoryItem = {
    ...item,
    id,
    created_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(newItem);

    req.onsuccess = () => resolve(newItem);
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalHistoryItems(): Promise<LocalHistoryItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const items = (req.result as LocalHistoryItem[]) || [];
      // Sort newest first
      items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalHistoryItem(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllLocalHistory(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
