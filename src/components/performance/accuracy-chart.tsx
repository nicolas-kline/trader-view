'use client';

interface Prediction {
  id: string;
  compositeScore: number;
  confidence: number;
  action: string;
  outcomeCorrect: boolean | null;
  actualReturn: number | null;
  createdAt: string;
}

interface AccuracyChartProps {
  predictions: Prediction[];
}

export function AccuracyChart({ predictions }: AccuracyChartProps) {
  // Filter to predictions with outcome data
  const evaluated = predictions.filter(p => p.outcomeCorrect != null);

  if (evaluated.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <div className="text-4xl font-bold text-muted-foreground">--</div>
        <div className="text-sm text-muted-foreground mt-1">No evaluated predictions yet</div>
      </div>
    );
  }

  // Sort by date ascending for rolling computation
  const sorted = [...evaluated].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Overall accuracy
  const correct = sorted.filter(p => p.outcomeCorrect === true).length;
  const total = sorted.length;
  const accuracy = (correct / total) * 100;

  // Rolling 30-day accuracy
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recent = sorted.filter(p => new Date(p.createdAt) >= thirtyDaysAgo);
  const recentCorrect = recent.filter(p => p.outcomeCorrect === true).length;
  const recentAccuracy = recent.length > 0 ? (recentCorrect / recent.length) * 100 : null;

  const displayAccuracy = recentAccuracy ?? accuracy;

  // Color based on accuracy
  const color =
    displayAccuracy > 55
      ? 'text-emerald-400'
      : displayAccuracy >= 50
        ? 'text-yellow-400'
        : 'text-red-400';

  const barColor =
    displayAccuracy > 55
      ? 'bg-emerald-500'
      : displayAccuracy >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        {recentAccuracy != null ? '30-Day Rolling Accuracy' : 'Overall Accuracy'}
      </div>

      {/* Large number */}
      <div className={`text-5xl font-bold font-mono ${color}`}>
        {displayAccuracy.toFixed(1)}%
      </div>

      {/* Progress bar */}
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(displayAccuracy, 100)}%` }}
        />
        {/* 50% marker */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {recentAccuracy != null
            ? `${recentCorrect}/${recent.length} correct (30d)`
            : `${correct}/${total} correct (all time)`}
        </span>
        {recentAccuracy != null && (
          <span>
            Overall: {accuracy.toFixed(1)}% ({correct}/{total})
          </span>
        )}
      </div>
    </div>
  );
}
