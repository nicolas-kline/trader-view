'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function ModeToggle() {
  const { settings, loading, updateSettings } = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading || !settings) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-5 w-10 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  const isLive = settings.mode === 'LIVE';

  const handleToggle = () => {
    if (!isLive) {
      // Switching to LIVE - show confirmation
      setConfirmOpen(true);
    } else {
      // Switching to PAPER - no confirmation needed
      updateSettings({ mode: 'PAPER' });
    }
  };

  const confirmLive = () => {
    updateSettings({ mode: 'LIVE' });
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">Trading Mode</div>
          <div className="text-xs text-muted-foreground">
            Switch between paper trading and live trading.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={
              !isLive
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-zinc-500/10 text-zinc-500'
            }
          >
            PAPER
          </Badge>
          <Switch
            checked={isLive}
            onCheckedChange={handleToggle}
          />
          <Badge
            className={
              isLive
                ? 'bg-red-500/20 text-red-400'
                : 'bg-zinc-500/10 text-zinc-500'
            }
          >
            LIVE
          </Badge>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to Live Trading?</DialogTitle>
            <DialogDescription>
              Are you sure? This will use real money. All trades will be executed with your live Alpaca account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmLive}
            >
              Enable Live Trading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
