import { useEffect, useState } from "react";

export const ADMIN_SEARCH_DEBOUNCE_MS = 1_500;

export function useDebouncedValue<T>(value: T, delayMs = ADMIN_SEARCH_DEBOUNCE_MS) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}
