'use client';

import { useState, useEffect, useCallback } from 'react';

export function usePredictions(limit = 200) {
  const [predictions, setPredictions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = useCallback(async () => {
    try {
      const res = await fetch(`/api/predictions?limit=${limit}`);
      const data = await res.json();
      setPredictions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  return { predictions, loading, refetch: fetchPredictions };
}
