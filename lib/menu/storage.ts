"use client";

/**
 * 菜谱本地存储
 * key: menu-history-YYYY-MM-DD
 * value: MenuRecord
 */

export interface MenuRecord {
  date: string; // 2026-04-24
  dateLabel: string; // 2026年4月24日 星期五
  adult: Array<{
    name: string;
    category: string;
    ingredients: string[];
    steps: string[];
    sourceUrl?: string;
    difficulty?: number;
    nutrition?: string;
  }>;
  baby: Array<{
    name: string;
    basedOn?: string;
    category: string;
    nutrition?: string;
    ingredients: string[];
    steps: string[];
  }>;
  savedAt: number;
}

const KEY_PREFIX = "menu-history-";
const INDEX_KEY = "menu-history-index";

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function saveMenu(record: Omit<MenuRecord, "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const date = record.date || todayKey();
    const full: MenuRecord = { ...record, date, savedAt: Date.now() };
    localStorage.setItem(KEY_PREFIX + date, JSON.stringify(full));

    // 维护 index
    const indexRaw = localStorage.getItem(INDEX_KEY);
    const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!index.includes(date)) {
      index.push(date);
      index.sort().reverse();
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    }
  } catch {
    // quota exceeded or disabled
  }
}

export function listMenus(): MenuRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const indexRaw = localStorage.getItem(INDEX_KEY);
    const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    const records: MenuRecord[] = [];
    for (const date of index) {
      const raw = localStorage.getItem(KEY_PREFIX + date);
      if (raw) {
        try {
          records.push(JSON.parse(raw));
        } catch {
          // skip
        }
      }
    }
    return records;
  } catch {
    return [];
  }
}

export function getMenu(date: string): MenuRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_PREFIX + date);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deleteMenu(date: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY_PREFIX + date);
    const indexRaw = localStorage.getItem(INDEX_KEY);
    const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    const next = index.filter((d) => d !== date);
    localStorage.setItem(INDEX_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
