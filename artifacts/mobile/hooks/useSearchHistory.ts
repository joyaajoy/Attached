import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Station } from "@workspace/api-client-react";

const KEY = "@search_history";
const MAX = 6;

export interface SearchEntry {
  from: Station;
  to: Station;
  date: string;
  ts: number;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => raw ? setHistory(JSON.parse(raw)) : null)
      .catch(() => {});
  }, []);

  const addSearch = useCallback(async (from: Station, to: Station, date: string) => {
    setHistory(prev => {
      const filtered = prev.filter(
        e => !(e.from.code === from.code && e.to.code === to.code)
      );
      const next = [{ from, to, date, ts: Date.now() }, ...filtered].slice(0, MAX);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  return { history, addSearch, clearHistory };
}
