'use client';

import { useState, useEffect, useCallback } from 'react';

export function usePortfolio(mode: 'PAPER' | 'LIVE' = 'PAPER', limit = 100) {
  const [snapshots, setSnapshots] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch(`/api/portfolio?mode=${mode}&limit=${limit}`);
      const data = await res.json();
      setSnapshots(data);
    } finally {
      setLoading(false);
    }
  }, [mode, limit]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { snapshots, loading, refetch: fetchPortfolio };
}
