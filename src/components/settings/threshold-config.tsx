'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

export function ThresholdConfig() {
  const { settings, loading, updateSettings } = useSettings();

  const [buyThreshold, setBuyThreshold] = useState(0.3);
  const [sellThreshold, setSellThreshold] = useState(-0.3);
  const [maxPositionPct, setMaxPositionPct] = useState(0.95);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setBuyThreshold(settings.buyThreshold);
      setSellThreshold(settings.sellThreshold);
      setMaxPositionPct(settings.maxPositionPct);
      setDirty(false);
    }
  }, [settings]);

  if (loading || !settings) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="h-2 w-full rounded bg-muted animate-pulse" />
        <div className="h-2 w-full rounded bg-muted animate-pulse" />
        <div className="h-2 w-full rounded bg-muted animate-pulse" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        buyThreshold,
        sellThreshold,
        maxPositionPct,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-6">
      <div>
        <div className="text-sm font-medium text-foreground">Trade Thresholds</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Configure the composite score thresholds for buy/sell signals and max position size.
        </div>
      </div>

      {/* Buy Threshold */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">Buy Threshold</label>
          <span className="text-sm font-mono font-medium text-emerald-400">
            {buyThreshold.toFixed(2)}
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          value={[buyThreshold * 100]}
          onValueChange={(value) => {
            const vals = Array.isArray(value) ? value : [value];
            setBuyThreshold(vals[0] / 100);
            setDirty(true);
          }}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0.00</span>
          <span>1.00</span>
        </div>
      </div>

      {/* Sell Threshold */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">Sell Threshold</label>
          <span className="text-sm font-mono font-medium text-red-400">
            {sellThreshold.toFixed(2)}
          </span>
        </div>
        <Slider
          min={-100}
          max={0}
          value={[sellThreshold * 100]}
          onValueChange={(value) => {
            const vals = Array.isArray(value) ? value : [value];
            setSellThreshold(vals[0] / 100);
            setDirty(true);
          }}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>-1.00</span>
          <span>0.00</span>
        </div>
      </div>

      {/* Max Position % */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">Max Position %</label>
          <span className="text-sm font-mono font-medium text-foreground">
            {(maxPositionPct * 100).toFixed(0)}%
          </span>
        </div>
        <Slider
          min={50}
          max={100}
          value={[maxPositionPct * 100]}
          onValueChange={(value) => {
            const vals = Array.isArray(value) ? value : [value];
            setMaxPositionPct(vals[0] / 100);
            setDirty(true);
          }}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={!dirty || saving}
        className="w-full"
      >
        {saving ? 'Saving...' : dirty ? 'Save Thresholds' : 'No Changes'}
      </Button>
    </div>
  );
}
