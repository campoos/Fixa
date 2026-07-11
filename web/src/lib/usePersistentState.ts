import { useEffect, useState } from "react";

// useState que persiste em localStorage (lembra a escolha entre reloads e ao reabrir o site)
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key);
      return s != null ? (JSON.parse(s) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage cheio/indisponível: ignora */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
