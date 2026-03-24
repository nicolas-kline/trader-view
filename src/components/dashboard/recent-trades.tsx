'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Trade {
  id: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  status: string;
  filledPrice: number | null;
  filledQty: number | null;
  filledNotional: number | null;
  realizedPnl: number | null;
  createdAt: string;
}

export function RecentTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trades?limit=5')
      .then((res) => res.json())
      .then((data: Trade[]) => {
        if (Array.isArray(data)) setTrades(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trades yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => {
                const pnl = trade.realizedPnl;
                const pnlPositive = pnl !== null && pnl >= 0;
                const pnlColor = pnl !== null
                  ? pnlPositive
                    ? 'text-trading-green'
                    : 'text-trading-red'
                  : 'text-muted-foreground';

                return (
                  <TableRow key={trade.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          trade.action === 'BUY'
                            ? 'bg-trading-green/20 text-trading-green border-trading-green/30'
                            : trade.action === 'SELL'
                              ? 'bg-trading-red/20 text-trading-red border-trading-red/30'
                              : 'bg-muted text-muted-foreground'
                        }
                      >
                        {trade.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {trade.filledPrice !== null
                        ? `$${trade.filledPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '--'}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {trade.filledQty !== null
                        ? trade.filledQty.toFixed(6)
                        : trade.filledNotional !== null
                          ? `$${trade.filledNotional.toFixed(2)}`
                          : '--'}
                    </TableCell>
                    <TableCell className={`text-right font-mono tabular-nums ${pnlColor}`}>
                      {pnl !== null
                        ? `${pnlPositive ? '+' : ''}$${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '--'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          trade.status === 'FILLED'
                            ? 'bg-trading-green/10 text-trading-green border-trading-green/20'
                            : trade.status === 'FAILED' || trade.status === 'CANCELLED'
                              ? 'bg-trading-red/10 text-trading-red border-trading-red/20'
                              : 'bg-trading-yellow/10 text-trading-yellow border-trading-yellow/20'
                        }
                      >
                        {trade.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
