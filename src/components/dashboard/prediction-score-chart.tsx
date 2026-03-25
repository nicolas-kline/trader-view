'use client';

import { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer } from '@/components/charts/chart-container';
import { usePredictions } from '@/hooks/use-predictions';
import type { Time } from 'lightweight-charts';

interface Prediction {
  id: string;
  compositeScore: number;
  confidence: number;
  action: string;
  createdAt: string;
}

export function PredictionScoreChart() {
  const { predictions, loading } = usePredictions(200);

  const sorted = useMemo(() => {
    if (!Array.isArray(predictions)) return [];
    const typed = predictions as Prediction[];
    return [...typed].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [predictions]);

  const chartData = useMemo(() => {
    return sorted.map((p) => ({
      time: (Math.floor(new Date(p.createdAt).getTime() / 1000)) as Time,
      value: p.compositeScore,
    }));
  }, [sorted]);

  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction Score</CardTitle>
          <Skeleton className="h-8 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Prediction Score</CardTitle>
          {latest && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                latest.action === 'BUY'
                  ? 'bg-green-500/20 text-green-400'
                  : latest.action === 'SELL'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-zinc-500/20 text-zinc-400'
              }`}
            >
              {latest.action}
            </span>
          )}
        </div>
        {latest && (
          <p className="text-2xl font-bold font-mono text-foreground tabular-nums">
            {latest.compositeScore >= 0 ? '+' : ''}
            {latest.compositeScore.toFixed(4)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer
            data={chartData}
            chartType="area"
            height={250}
            seriesOptions={{
              lineColor: '#a78bfa',
              topColor: 'rgba(167,139,250,0.25)',
              bottomColor: 'rgba(167,139,250,0.02)',
              lineWidth: 2,
            }}
          />
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
            No prediction data yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
