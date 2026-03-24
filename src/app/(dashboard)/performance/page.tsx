'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AccuracyChart } from '@/components/performance/accuracy-chart';
import { SignalRankings } from '@/components/performance/signal-rankings';

interface Prediction {
  id: string;
  compositeScore: number;
  confidence: number;
  action: string;
  reasoning: string;
  signalSnapshot: Record<string, unknown>;
  priceAtPrediction: number;
  priceAfter1h: number | null;
  priceAfter4h: number | null;
  priceAfter24h: number | null;
  outcomeCorrect: boolean | null;
  actualReturn: number | null;
  createdAt: string;
}

export default function PerformancePage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const res = await fetch('/api/predictions?limit=200');
        if (res.ok) {
          const data = await res.json();
          setPredictions(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPredictions();
  }, []);

  // Compute accuracy by action type
  const evaluated = predictions.filter(p => p.outcomeCorrect != null);
  const byAction: Record<string, { total: number; correct: number }> = {};
  for (const p of evaluated) {
    if (!byAction[p.action]) byAction[p.action] = { total: 0, correct: 0 };
    byAction[p.action].total++;
    if (p.outcomeCorrect) byAction[p.action].correct++;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Prediction Performance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track prediction accuracy, signal contributions, and trading outcomes.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Top row: accuracy + action breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Overall accuracy */}
              <div className="lg:col-span-2">
                <AccuracyChart predictions={predictions} />
              </div>

              {/* Accuracy by action */}
              {(['BUY', 'SELL', 'HOLD'] as const).map(action => {
                const stats = byAction[action];
                const pct = stats ? (stats.correct / stats.total) * 100 : 0;
                const color =
                  action === 'BUY'
                    ? 'text-emerald-400'
                    : action === 'SELL'
                      ? 'text-red-400'
                      : 'text-zinc-400';
                const barColor =
                  action === 'BUY'
                    ? 'bg-emerald-500'
                    : action === 'SELL'
                      ? 'bg-red-500'
                      : 'bg-zinc-500';

                return (
                  <Card key={action}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {action} Accuracy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats ? (
                        <div className="space-y-2">
                          <div className={`text-3xl font-bold font-mono ${color}`}>
                            {pct.toFixed(1)}%
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stats.correct}/{stats.total} correct
                          </div>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-muted-foreground">--</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Signal Rankings */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Signal Performance Rankings</h2>
              <SignalRankings />
            </div>

            {/* Recent Predictions table */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Predictions</h2>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs text-right">Score</TableHead>
                      <TableHead className="text-xs text-right">Confidence</TableHead>
                      <TableHead className="text-xs text-right">Price</TableHead>
                      <TableHead className="text-xs text-right">Return</TableHead>
                      <TableHead className="text-xs">Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.slice(0, 50).map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString()}{' '}
                          <span className="text-muted-foreground/60">
                            {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              p.action === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : p.action === 'SELL'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-zinc-500/20 text-zinc-400'
                            }
                          >
                            {p.action}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-xs text-right font-mono ${
                            p.compositeScore >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {p.compositeScore.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-muted-foreground">
                          {(p.confidence * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          ${p.priceAtPrediction.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={`text-xs text-right font-mono ${
                            p.actualReturn != null
                              ? p.actualReturn >= 0
                                ? 'text-emerald-400'
                                : 'text-red-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {p.actualReturn != null ? `${(p.actualReturn * 100).toFixed(2)}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {p.outcomeCorrect != null ? (
                            <Badge
                              className={
                                p.outcomeCorrect
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }
                            >
                              {p.outcomeCorrect ? 'Correct' : 'Wrong'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {predictions.length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No predictions yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
