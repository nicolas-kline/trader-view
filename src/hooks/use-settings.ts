'use client';

import { useState, useEffect, useCallback } from 'react';

interface Settings {
  id: string;
  mode: 'PAPER' | 'LIVE';
  tradeFrequencyHours: number;
  buyThreshold: number;
  sellThreshold: number;
  maxPositionPct: number;
  minTradeUsd: number;
  signalWeights: Record<string, number>;
  enabledSignals: string[];
  lastEngineRun: string | null;
  lastEngineStatus: string | null;
  lastEngineMessage: string | null;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    setSettings(data);
    return data;
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
