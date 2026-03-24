'use client';

import { useSettings } from '@/hooks/use-settings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FREQUENCY_OPTIONS = [
  { label: 'Every 1 hour', value: 1 },
  { label: 'Every 4 hours', value: 4 },
  { label: 'Every 8 hours', value: 8 },
  { label: 'Every 12 hours', value: 12 },
  { label: 'Every 24 hours', value: 24 },
];

export function FrequencyConfig() {
  const { settings, loading, updateSettings } = useSettings();

  if (loading || !settings) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="h-4 w-24 rounded bg-muted animate-pulse mb-2" />
        <div className="h-8 w-40 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  const handleChange = (val: unknown) => {
    const hours = Number(val);
    if (!isNaN(hours)) {
      updateSettings({ tradeFrequencyHours: hours });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div>
        <div className="text-sm font-medium text-foreground">Trade Frequency</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          How often the prediction engine runs and evaluates trades.
        </div>
      </div>
      <Select
        value={settings.tradeFrequencyHours}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select frequency" />
        </SelectTrigger>
        <SelectContent>
          {FREQUENCY_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
