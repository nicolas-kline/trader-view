'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SignalHistoryChart } from '@/components/signals/signal-history-chart';
import { SignalGauge } from '@/components/signals/signal-gauge';
import { Skeleton } from '@/components/ui/skeleton';

const SIGNAL_SOURCES: Record<string, string[]> = {
  Technical: ['macd', 'rsi', 'bollinger', 'volume_trend'],
  Sentiment: ['fear_greed', 'news_sentiment'],
  Macro: ['vix', 'fed_rate', 'treasury_spread'],
  Crypto: ['gas_fees', 'coingecko_momentum'],
};

interface Signal {
  id: string;
  name: string;
  rawValue: number;
  normalizedValue: number;
  source: string;
  fetchedAt: string;
}

export default function SignalsPage() {
  const [latestSignals, setLatestSignals] = useState<Record<string, Signal>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch('/api/signals?limit=500');
        if (res.ok) {
          const data: Signal[] = await res.json();
          // Group by name, take latest for each
          const latest: Record<string, Signal> = {};
          for (const signal of data) {
            if (!latest[signal.name] || new Date(signal.fetchedAt) > new Date(latest[signal.name].fetchedAt)) {
              latest[signal.name] = signal;
            }
          }
          setLatestSignals(latest);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
  }, []);

  const tabKeys = Object.keys(SIGNAL_SOURCES);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Signal Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor trading signals across technical, sentiment, macro, and crypto sources.
          </p>
        </div>

        {/* Signal gauges overview */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
            {Object.values(latestSignals)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(signal => (
                <SignalGauge
                  key={signal.id}
                  name={signal.name}
                  value={signal.normalizedValue}
                  rawValue={signal.rawValue}
                  source={signal.source}
                />
              ))}
          </div>
        )}

        {/* Tabs for signal history by source */}
        <Tabs defaultValue={tabKeys[0]}>
          <TabsList>
            {tabKeys.map(key => (
              <TabsTrigger key={key} value={key}>
                {key}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabKeys.map(key => (
            <TabsContent key={key} value={key}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {SIGNAL_SOURCES[key].map(signalName => (
                  <div key={signalName} className="rounded-lg border border-border bg-card p-4">
                    <SignalHistoryChart signalName={signalName} />
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
