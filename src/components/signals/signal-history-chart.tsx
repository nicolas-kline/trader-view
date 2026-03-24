'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Signal {
  id: string;
  name: string;
  rawValue: number;
  normalizedValue: number;
  source: string;
  fetchedAt: string;
}

interface SignalHistoryChartProps {
  signalName: string;
}

export function SignalHistoryChart({ signalName }: SignalHistoryChartProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignals() {
      try {
        const res = await fetch(`/api/signals?name=${encodeURIComponent(signalName)}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setSignals(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchSignals();
  }, [signalName]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm rounded-lg border border-border">
        No data for {signalName}
      </div>
    );
  }

  // Reverse so oldest is on the left
  const sorted = [...signals].reverse();
  const latest = signals[0];
  const maxAbs = Math.max(...sorted.map(s => Math.abs(s.normalizedValue)), 0.01);

  return (
    <div className="space-y-3">
      {/* Latest value display */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground capitalize">
          {signalName.replace(/_/g, ' ')}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Latest:</span>
          <span
            className={`text-lg font-bold font-mono ${
              latest.normalizedValue >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {latest.normalizedValue.toFixed(3)}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            (raw: {latest.rawValue.toFixed(2)})
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="relative rounded-lg border border-border bg-muted/20 p-3">
        {/* Zero line */}
        <div className="absolute left-3 right-3 top-1/2 h-px bg-border" />

        <div className="flex items-center gap-px" style={{ height: 120 }}>
          {sorted.map((signal, i) => {
            const normalizedHeight = Math.abs(signal.normalizedValue) / maxAbs;
            const heightPct = Math.max(normalizedHeight * 50, 1); // percentage of half-height
            const isPositive = signal.normalizedValue >= 0;

            return (
              <div
                key={signal.id}
                className="flex-1 flex flex-col items-center justify-center relative"
                style={{ height: '100%' }}
                title={`${new Date(signal.fetchedAt).toLocaleDateString()} | normalized: ${signal.normalizedValue.toFixed(3)} | raw: ${signal.rawValue.toFixed(2)}`}
              >
                {/* Top half (positive) */}
                <div className="flex-1 flex items-end w-full px-px">
                  {isPositive && (
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: `rgb(16, 185, 129)`,
                        opacity: 0.4 + (i / sorted.length) * 0.6,
                      }}
                    />
                  )}
                </div>
                {/* Bottom half (negative) */}
                <div className="flex-1 flex items-start w-full px-px">
                  {!isPositive && (
                    <div
                      className="w-full rounded-b-sm transition-all"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: `rgb(239, 68, 68)`,
                        opacity: 0.4 + (i / sorted.length) * 0.6,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Date labels */}
        <div className="flex justify-between mt-2">
          {sorted.length > 0 && (
            <>
              <span className="text-[10px] text-muted-foreground">
                {new Date(sorted[0].fetchedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
              {sorted.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  {new Date(sorted[Math.floor(sorted.length / 2)].fetchedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {new Date(sorted[sorted.length - 1].fetchedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
