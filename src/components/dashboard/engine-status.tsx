'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EngineStatusData {
  lastEngineRun: string | null;
  lastEngineStatus: string | null;
  lastEngineMessage: string | null;
}

export function EngineStatus() {
  const [status, setStatus] = useState<EngineStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/engine/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleRun = async () => {
    setRunning(true);
    try {
      await fetch('/api/engine/run', { method: 'POST' });
      // Refresh status after run
      await fetchStatus();
    } catch {
      // ignore
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Engine Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  const lastRun = status?.lastEngineRun
    ? formatDistanceToNow(new Date(status.lastEngineRun), { addSuffix: true })
    : 'Never';

  const engineStatus = status?.lastEngineStatus ?? 'unknown';
  const isSuccess = engineStatus === 'success';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engine Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last Run</span>
          <span className="font-mono text-sm text-foreground">{lastRun}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge
            variant="outline"
            className={
              isSuccess
                ? 'bg-trading-green/20 text-trading-green border-trading-green/30'
                : engineStatus === 'unknown'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-trading-red/20 text-trading-red border-trading-red/30'
            }
          >
            {engineStatus}
          </Badge>
        </div>
        {status?.lastEngineMessage && (
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Message</span>
            <p className="text-xs text-foreground bg-muted/50 rounded p-2 font-mono leading-relaxed">
              {status.lastEngineMessage}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRun}
          disabled={running}
          className="w-full"
        >
          {running ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-3.5 w-3.5" />
              Run Engine
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
