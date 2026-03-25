'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/hooks/use-settings';
import { useSSE } from '@/hooks/use-sse';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/trades': 'Trades',
  '/signals': 'Signals',
  '/performance': 'Performance',
  '/settings': 'Settings',
};

export function Header() {
  const pathname = usePathname();
  const { settings, loading } = useSettings();
  const { connected } = useSSE('/api/stream');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const title = PAGE_TITLES[pathname] ?? 'TraderView';
  const mode = settings?.mode ?? 'PAPER';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <h1 className="font-heading text-lg font-semibold tracking-tight">{title}</h1>

      <div className="flex items-center gap-4">
        {!loading && (
          <Badge
            className={
              mode === 'LIVE'
                ? 'bg-trading-red/20 text-trading-red border-trading-red/30'
                : 'bg-trading-green/20 text-trading-green border-trading-green/30'
            }
            variant="outline"
          >
            {mode}
          </Badge>
        )}

        <div className="flex items-center gap-1.5" title={connected ? 'SSE Connected' : 'SSE Disconnected'}>
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'bg-trading-green animate-pulse' : 'bg-muted-foreground'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>

        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {currentTime}
        </span>
      </div>
    </header>
  );
}
