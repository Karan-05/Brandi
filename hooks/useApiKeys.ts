"use client";

import { useEffect, useRef, useState } from "react";

export type ApiKeys = {
  firecrawlKey: string;
  groqKey: string;
};

const STORAGE_KEY = "byok-api-keys";

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeys>({ firecrawlKey: "", groqKey: "" });
  const keysRef = useRef<ApiKeys>({ firecrawlKey: "", groqKey: "" });
  const didMount = useRef(false);

  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ApiKeys>;
      const loaded: ApiKeys = {
        firecrawlKey: typeof parsed.firecrawlKey === "string" ? parsed.firecrawlKey : "",
        groqKey: typeof parsed.groqKey === "string" ? parsed.groqKey : "",
      };
      keysRef.current = loaded;
      setKeys(loaded);
    } catch {}
  }, []);

  function updateKeys(next: ApiKeys) {
    keysRef.current = next;
    setKeys(next);
    try {
      if (next.firecrawlKey || next.groqKey) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }

  function clearKeys() {
    updateKeys({ firecrawlKey: "", groqKey: "" });
  }

  return { keys, updateKeys, clearKeys };
}
