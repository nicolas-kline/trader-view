'use client';

interface SignalGaugeProps {
  name: string;
  value: number;       // normalizedValue -1 to 1
  rawValue: number;
  source: string;
}

export function SignalGauge({ name, value, rawValue, source }: SignalGaugeProps) {
  // Clamp value to [-1, 1]
  const clamped = Math.max(-1, Math.min(1, value));
  // Convert to 0-100 position percentage
  const positionPct = ((clamped + 1) / 2) * 100;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground capitalize">
          {name.replace(/_/g, ' ')}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {source}
        </span>
      </div>

      {/* Gauge bar */}
      <div className="relative h-3 rounded-full overflow-hidden">
        {/* Gradient background: red -> yellow -> green */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(234, 179, 8), rgb(16, 185, 129))',
          }}
        />
        {/* Marker dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-zinc-900 shadow-md transition-all duration-300"
          style={{ left: `${positionPct}%` }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>-1.0</span>
        <span>0</span>
        <span>+1.0</span>
      </div>

      {/* Values */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Raw: <span className="font-mono text-foreground">{rawValue.toFixed(2)}</span>
        </span>
        <span
          className={`font-mono font-semibold ${
            clamped >= 0.1
              ? 'text-emerald-400'
              : clamped <= -0.1
                ? 'text-red-400'
                : 'text-yellow-400'
          }`}
        >
          {clamped >= 0 ? '+' : ''}{clamped.toFixed(3)}
        </span>
      </div>
    </div>
  );
}
