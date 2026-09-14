'use client';

/**
 * Unified IndexedDB helper for offline persistence (history & presets).
 * Ensures a single source of truth for database versioning and schema migrations.
 */

export const LOCAL_DB_NAME = 'VoiceGeneratorDB';
export const LOCAL_DB_VERSION = 2;

export function getLocalDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = indexedDB.open(LOCAL_DB_NAME, LOCAL_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      // 1. History store
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id' });
        historyStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // 2. Presets store
      if (!db.objectStoreNames.contains('presets')) {
        const presetStore = db.createObjectStore('presets', { keyPath: 'id' });
        presetStore.createIndex('created_at', 'created_at', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn('IndexedDB database upgrade blocked. Please close other open tabs of this app.');
    };
  });
}
