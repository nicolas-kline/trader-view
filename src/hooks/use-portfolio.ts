'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

type Period = '1d' | '7d' | '1m' | '3m';

export function usePortfolio(
  mode: 'PAPER' | 'LIVE' = 'PAPER',
  limit = 1000,
  period: Period = '7d'
) {
  const [snapshots, setSnapshots] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const fromDate = useMemo(() => {
    const now = new Date();
    const daysAgo = {
      '1d': 1,
      '7d': 7,
      '1m': 30,
      '3m': 90,
    }[period];

    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  }, [period]);

  const fetchPortfolio = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        mode,
        limit: limit.toString(),
        fromDate,
      });
      const res = await fetch(`/api/portfolio?${params}`);
      const data = await res.json();
      setSnapshots(data);
    } finally {
      setLoading(false);
    }
  }, [mode, limit, fromDate]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { snapshots, loading, refetch: fetchPortfolio };
}
