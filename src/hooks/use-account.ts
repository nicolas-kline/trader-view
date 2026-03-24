'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LiveAccount {
  mode: 'PAPER' | 'LIVE';
  equity: number;
  cash: number;
  buyingPower: number;
  ethPrice: number;
  position: {
    qty: number;
    avgEntry: number;
    marketValue: number;
    unrealizedPl: number;
    unrealizedPlPct: number;
    currentPrice: number;
    side: string;
  } | null;
}

export function useAccount() {
  const [account, setAccount] = useState<LiveAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    try {
      const res = await fetch('/api/account');
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to fetch account');
        return;
      }
      const data: LiveAccount = await res.json();
      setAccount(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAccount, 30_000);
    return () => clearInterval(interval);
  }, [fetchAccount]);

  return { account, loading, error, refetch: fetchAccount };
}
