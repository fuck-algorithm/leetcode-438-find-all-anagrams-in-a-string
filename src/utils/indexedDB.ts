import { openDB } from 'idb';
import type { DBSchema } from 'idb';

interface AppDB extends DBSchema {
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
      timestamp: number;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: unknown;
      timestamp: number;
    };
  };
}

const DB_NAME = 'leetcode-438-app';
const DB_VERSION = 1;

async function getDB() {
  return openDB<AppDB>(DB_NAME, DB_VERSION, {
    upgrade(db: import('idb').IDBPDatabase<AppDB>) {
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    },
  });
}

// 保存设置
export async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('settings', {
    key,
    value,
    timestamp: Date.now(),
  });
}

// 获取设置
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    const result = await db.get('settings', key);
    return result ? (result.value as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// 保存缓存（带过期时间）
export async function saveCache(key: string, data: unknown): Promise<void> {
  const db = await getDB();
  await db.put('cache', {
    key,
    data,
    timestamp: Date.now(),
  });
}

// 获取缓存（检查是否过期，默认1小时）
export async function getCache<T>(
  key: string,
  maxAge: number = 3600000
): Promise<T | null> {
  try {
    const db = await getDB();
    const result = await db.get('cache', key);
    if (result && Date.now() - result.timestamp < maxAge) {
      return result.data as T;
    }
    return null;
  } catch {
    return null;
  }
}

// 获取过期的缓存（用于fallback）
export async function getExpiredCache<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    const result = await db.get('cache', key);
    return result ? (result.data as T) : null;
  } catch {
    return null;
  }
}
