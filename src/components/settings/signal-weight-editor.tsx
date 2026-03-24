'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/hooks/use-settings';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ALL_SIGNALS = [
  'macd',
  'rsi',
  'bollinger',
  'volume_trend',
  'fear_greed',
  'news_sentiment',
  'vix',
  'fed_rate',
  'treasury_spread',
  'gas_fees',
  'coingecko_momentum',
];

export function SignalWeightEditor() {
  const { settings, loading, updateSettings } = useSettings();

  const [weights, setWeights] = useState<Record<string, number>>({});
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setWeights(settings.signalWeights || {});
      setEnabled(new Set(settings.enabledSignals || ALL_SIGNALS));
      setDirty(false);
    }
  }, [settings]);

  // Normalize weights to sum to 1.0 among enabled signals
  const normalizeWeights = useCallback(
    (raw: Record<string, number>, enabledSet: Set<string>) => {
      const enabledWeights = Object.entries(raw).filter(([k]) => enabledSet.has(k));
      const sum = enabledWeights.reduce((acc, [, v]) => acc + v, 0);
      if (sum === 0) return raw;
      const normalized: Record<string, number> = { ...raw };
      for (const [key] of enabledWeights) {
        normalized[key] = raw[key] / sum;
      }
      return normalized;
    },
    []
  );

  const handleWeightChange = (name: string, val: number) => {
    const newWeights = { ...weights, [name]: val };
    setWeights(newWeights);
    setDirty(true);
  };

  const handleToggle = (name: string) => {
    const newEnabled = new Set(enabled);
    if (newEnabled.has(name)) {
      newEnabled.delete(name);
    } else {
      newEnabled.add(name);
    }
    setEnabled(newEnabled);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalized = normalizeWeights(weights, enabled);
      await updateSettings({
        signalWeights: normalized,
        enabledSignals: Array.from(enabled),
      });
      setWeights(normalized);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  // Display normalized weights
  const displayWeights = normalizeWeights(weights, enabled);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div>
        <div className="text-sm font-medium text-foreground">Signal Weights</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Enable/disable signals and adjust their weights. Weights auto-normalize to sum to 1.0.
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs w-8">On</TableHead>
              <TableHead className="text-xs">Signal</TableHead>
              <TableHead className="text-xs w-48">Weight</TableHead>
              <TableHead className="text-xs text-right w-20">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ALL_SIGNALS.map(name => {
              const isEnabled = enabled.has(name);
              const rawWeight = weights[name] ?? (1 / ALL_SIGNALS.length);
              const normalizedWeight = isEnabled ? (displayWeights[name] ?? 0) : 0;

              return (
                <TableRow key={name} className={!isEnabled ? 'opacity-40' : ''}>
                  <TableCell>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(name)}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="text-sm font-medium capitalize">
                    {name.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    <Slider
                      min={0}
                      max={100}
                      value={[rawWeight * 100]}
                      onValueChange={(value) => {
                      const vals = Array.isArray(value) ? value : [value];
                      handleWeightChange(name, vals[0] / 100);
                    }}
                      disabled={!isEnabled}
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {isEnabled ? `${(normalizedWeight * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Total check */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {enabled.size} of {ALL_SIGNALS.length} signals enabled
        </span>
        <span className="font-mono">
          Total: {(Object.entries(displayWeights).filter(([k]) => enabled.has(k)).reduce((a, [, v]) => a + v, 0) * 100).toFixed(1)}%
        </span>
      </div>

      <Button
        onClick={handleSave}
        disabled={!dirty || saving}
        className="w-full"
      >
        {saving ? 'Saving...' : dirty ? 'Save Signal Weights' : 'No Changes'}
      </Button>
    </div>
  );
}
