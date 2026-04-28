"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClassifyApiSuccess } from "@/lib/types";

export type HistoryEntry = ClassifyApiSuccess & { classifiedAt: number };

const STORAGE_KEY = "classification-history";
const MAX_ENTRIES = 50;

export function useClassificationHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const historyRef = useRef<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryEntry[];
        historyRef.current = parsed;
        setHistory(parsed);
      }
    } catch {
      // ignore corrupt or missing storage
    }
  }, []);

  const addResult = useCallback((result: ClassifyApiSuccess) => {
    const entry: HistoryEntry = { ...result, classifiedAt: Date.now() };
    const prev = historyRef.current;
    const deduped = prev.filter((r) => r.normalizedUrl !== result.normalizedUrl);
    const next = [entry, ...deduped].slice(0, MAX_ENTRIES);
    historyRef.current = next;
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota or private-browsing restrictions
    }
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { history, addResult, clearHistory };
}
