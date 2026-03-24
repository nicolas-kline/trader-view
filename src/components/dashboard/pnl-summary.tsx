'use client';

import { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio } from '@/hooks/use-portfolio';

interface Snapshot {
  id: string;
  equity: number;
  snapshotAt: string;
}

interface PeriodPnl {
  label: string;
  pnl: number;
  pct: number;
}

export function PnlSummary() {
  const { snapshots, loading } = usePortfolio('PAPER', 1000);

  const periods = useMemo<PeriodPnl[]>(() => {
    const typed = snapshots as Snapshot[];
    if (typed.length < 2) return [];

    // Snapshots are desc from API
    const sorted = [...typed].sort(
      (a, b) => new Date(a.snapshotAt).getTime() - new Date(b.snapshotAt).getTime()
    );

    const latest = sorted[sorted.length - 1];
    const now = new Date(latest.snapshotAt).getTime();

    const findClosest = (hoursAgo: number): Snapshot | null => {
      const target = now - hoursAgo * 3600_000;
      let best: Snapshot | null = null;
      let bestDiff = Infinity;
      for (const s of sorted) {
        const diff = Math.abs(new Date(s.snapshotAt).getTime() - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = s;
        }
      }
      return best;
    };

    const calc = (label: string, hoursAgo: number): PeriodPnl => {
      const ref = findClosest(hoursAgo);
      if (!ref || ref.id === latest.id) {
        return { label, pnl: 0, pct: 0 };
      }
      const pnl = latest.equity - ref.equity;
      const pct = ref.equity !== 0 ? (pnl / ref.equity) * 100 : 0;
      return { label, pnl, pct };
    };

    const allTime = (() => {
      const first = sorted[0];
      const pnl = latest.equity - first.equity;
      const pct = first.equity !== 0 ? (pnl / first.equity) * 100 : 0;
      return { label: 'All-Time', pnl, pct };
    })();

    return [
      calc('24h', 24),
      calc('7d', 7 * 24),
      calc('30d', 30 * 24),
      allTime,
    ];
  }, [snapshots]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>P&L Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>P&L Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {periods.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {periods.map((p) => {
              const positive = p.pnl >= 0;
              const sign = positive ? '+' : '';
              const color = positive ? 'text-trading-green' : 'text-trading-red';
              return (
                <div
                  key={p.label}
                  className="rounded-lg border border-border bg-muted/30 p-3"
                >
                  <p className="text-xs text-muted-foreground mb-1">{p.label}</p>
                  <p className={`font-mono text-sm font-semibold tabular-nums ${color}`}>
                    {sign}${Math.abs(p.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`font-mono text-xs tabular-nums ${color}`}>
                    {sign}{p.pct.toFixed(2)}%
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
