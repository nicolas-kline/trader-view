'use client';

import { useState, useEffect } from 'react';

export function useSSE<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource(url);

    source.onopen = () => setConnected(true);

    source.onmessage = (event) => {
      try {
        setData(JSON.parse(event.data));
      } catch {
        // ignore malformed messages
      }
    };

    source.onerror = () => setConnected(false);

    return () => source.close();
  }, [url]);

  return { data, connected };
}
