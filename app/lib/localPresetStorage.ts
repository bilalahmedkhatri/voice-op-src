'use client';

import { getLocalDB } from './localIndexedDB';

export interface VoicePresetItem {
  id: string;
  preset_name: string;
  model_id: string;
  voice_id: string;
  voice_name: string;
  language?: string;
  gender?: string;
  parameters: Record<string, any>;
  created_at: string;
}

const STORE_NAME = 'presets';

export async function saveLocalPreset(
  preset: Omit<VoicePresetItem, 'id' | 'created_at'>
): Promise<VoicePresetItem> {
  const db = await getLocalDB();
  const id = `pre_${crypto.randomUUID().replace(/-/g, '')}`;
  const newItem: VoicePresetItem = {
    ...preset,
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

export async function getLocalPresets(): Promise<VoicePresetItem[]> {
  const db = await getLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const items = (req.result as VoicePresetItem[]) || [];
      items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalPreset(id: string): Promise<void> {
  const db = await getLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
