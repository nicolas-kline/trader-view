'use client';

import { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  const { snapshots, loading: snapshotsLoading } = usePortfolio('PAPER', 200);
  const { account, loading: accountLoading } = useAccount();

  const sorted = useMemo(() => {
    if (!Array.isArray(snapshots)) return [];
    const typed = snapshots as Snapshot[];
    return [...typed].sort(
      (a, b) =>
        new Date(a.snapshotAt).getTime() - new Date(b.snapshotAt).getTime()
    );
  }, [snapshots]);

  const chartData = useMemo(() => {
    return sorted.map((s) => ({
      time: (Math.floor(new Date(s.snapshotAt).getTime() / 1000)) as Time,
      value: s.equity,
    }));
  }, [sorted]);

  const ethData = useMemo(() => {
    return sorted
      .filter((s) => s.ethPrice > 0)
      .map((s) => ({
        time: (Math.floor(new Date(s.snapshotAt).getTime() / 1000)) as Time,
        value: s.ethPrice,
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
