'use client';

import { getLocalDB } from './localIndexedDB';

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
  video_format?: 'short' | 'long' | string;
  parameters?: Record<string, any>;
  created_at: string;
}

const STORE_NAME = 'history';

export async function saveLocalHistoryItem(
  item: Omit<LocalHistoryItem, 'id' | 'created_at'> & { id?: string },
  expectedScope?: string
): Promise<LocalHistoryItem> {
  const db = await getLocalDB(expectedScope);
  const id = item.id || `loc_${crypto.randomUUID().replace(/-/g, '')}`;
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
  const db = await getLocalDB();
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

export async function deleteLocalHistoryItem(id: string | string[], expectedScope?: string): Promise<void> {
  const db = await getLocalDB(expectedScope);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const itemId of Array.isArray(id) ? id : [id]) store.delete(itemId);

    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('Audio deletion was interrupted.'));
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllLocalHistory(): Promise<void> {
  const db = await getLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
