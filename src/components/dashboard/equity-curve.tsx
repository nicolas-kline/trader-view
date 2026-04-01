'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/charts/chart-container';
import { usePortfolio } from '@/hooks/use-portfolio';
import { useAccount } from '@/hooks/use-account';
import type { Time } from 'lightweight-charts';

interface Snapshot {
  id: string;
  equity: number;
  ethPrice: number;
  snapshotAt: string;
}

export function EquityCurve() {
  const [mode, setMode] = useState<'PAPER' | 'LIVE'>('LIVE');
  const [period, setPeriod] = useState<'1d' | '7d' | '1m' | '3m'>('7d');
  const { snapshots, loading: snapshotsLoading } = usePortfolio(mode, 1000, period);
  const { account, loading: accountLoading } = useAccount();

  const sorted = useMemo(() => {
    if (!Array.isArray(snapshots)) return [];
    const typed = snapshots as Snapshot[];
    return [...typed].sort(
      (a, b) =>
        new Date(a.snapshotAt).getTime() - new Date(b.snapshotAt).getTime()
    );
  }, [snapshots]);

  // Normalize both portfolio and ETH price to percentage change from start
  const chartData = useMemo(() => {
    if (sorted.length === 0) return [];
    const firstEquity = sorted[0].equity;
    return sorted.map((s) => ({
      time: (Math.floor(new Date(s.snapshotAt).getTime() / 1000)) as Time,
      value: ((s.equity - firstEquity) / firstEquity) * 100,
    }));
  }, [sorted]);

  const ethData = useMemo(() => {
    if (sorted.length === 0) return [];
    const validSnapshots = sorted.filter((s) => s.ethPrice > 0);
    if (validSnapshots.length === 0) return [];
    const firstEthPrice = validSnapshots[0].ethPrice;
    return validSnapshots.map((s) => ({
      time: (Math.floor(new Date(s.snapshotAt).getTime() / 1000)) as Time,
      value: ((s.ethPrice - firstEthPrice) / firstEthPrice) * 100,
    }));
  }, [sorted]);

  // Use live equity if we have it, otherwise fall back to latest snapshot
  const displayEquity = useMemo(() => {
    if (account?.equity) return account.equity;
    if (!Array.isArray(snapshots)) return null;
    const typed = snapshots as Snapshot[];
    if (typed.length > 0) return typed[0].equity;
    return null;
  }, [account, snapshots]);

  const loading = snapshotsLoading && accountLoading;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
          <Skeleton className="h-8 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfolio Value</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-[#22c55e]" />
              Portfolio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-[#3b82f6]" />
              ETH
            </span>
          </div>
        </div>
        {displayEquity !== null && (
          <CardDescription>
            <span className="text-2xl font-bold font-mono text-foreground tabular-nums">
              ${displayEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </CardDescription>
        )}
        <div className="flex gap-3 mt-4">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={mode === 'PAPER' ? 'default' : 'outline'}
              onClick={() => setMode('PAPER')}
              className="text-xs"
            >
              PAPER
            </Button>
            <Button
              size="sm"
              variant={mode === 'LIVE' ? 'default' : 'outline'}
              onClick={() => setMode('LIVE')}
              className="text-xs"
            >
              LIVE
            </Button>
          </div>
          <div className="flex gap-1">
            {(['1d', '7d', '1m', '3m'] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'outline'}
                onClick={() => setPeriod(p)}
                className="text-xs"
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer
            data={chartData}
            chartType="area"
            height={300}
            overlayData={ethData}
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            {displayEquity !== null
              ? 'Chart data will appear after engine runs accumulate history'
              : 'No portfolio data yet'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
