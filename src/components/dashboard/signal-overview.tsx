'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Signal {
  id: string;
  name: string;
  rawValue: number;
  normalizedValue: number;
  source: string;
  fetchedAt: string;
}

function SignalGauge({ name, value }: { name: string; value: number }) {
  // value is in [-1, +1]
  // Map to percentage: -1 = 0%, 0 = 50%, +1 = 100%
  const pct = ((value + 1) / 2) * 100;

  // Determine color based on value
  let barColor: string;
  if (value > 0.2) {
    barColor = 'bg-trading-green';
  } else if (value < -0.2) {
    barColor = 'bg-trading-red';
  } else {
    barColor = 'bg-trading-yellow';
  }

  // Format name: replace underscores with spaces, title case
  const displayName = name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground truncate mr-2">{displayName}</span>
        <span className="font-mono text-xs tabular-nums text-foreground">
          {value >= 0 ? '+' : ''}
          {value.toFixed(2)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}

export function SignalOverview() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/signals?limit=11')
      .then((res) => res.json())
      .then((data: Signal[]) => {
        if (Array.isArray(data)) setSignals(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Deduplicate: keep only the latest signal per name
  const uniqueSignals = useMemo(() => {
    const map = new Map<string, Signal>();
    for (const s of signals) {
      if (!map.has(s.name)) {
        map.set(s.name, s);
      }
    }
    return Array.from(map.values());
  }, [signals]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Signal Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signal Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {uniqueSignals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No signal data</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {uniqueSignals.map((s) => (
              <SignalGauge key={s.name} name={s.name} value={s.normalizedValue} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
