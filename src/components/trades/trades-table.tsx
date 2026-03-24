'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TradeDetailModal } from './trade-detail-modal';

interface Trade {
  id: string;
  mode: string;
  action: string;
  symbol: string;
  status: string;
  orderId: string | null;
  requestedQty: number | null;
  requestedNotional: number | null;
  filledQty: number | null;
  filledPrice: number | null;
  filledNotional: number | null;
  entryPrice: number | null;
  exitPrice: number | null;
  realizedPnl: number | null;
  realizedPnlPct: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  prediction: {
    id: string;
    compositeScore: number;
    confidence: number;
    action: string;
    reasoning: string;
    signalSnapshot: Record<string, { raw: number; normalized: number; weight: number; confidence: number }>;
    priceAtPrediction: number;
    priceAfter1h: number | null;
    priceAfter4h: number | null;
    priceAfter24h: number | null;
    outcomeCorrect: boolean | null;
    actualReturn: number | null;
    createdAt: string;
  } | null;
}

type SortField = 'createdAt' | 'action' | 'symbol' | 'filledPrice' | 'filledQty' | 'realizedPnl' | 'realizedPnlPct' | 'compositeScore' | 'status';
type SortDir = 'asc' | 'desc';

export function TradesTable() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    async function fetchTrades() {
      try {
        const res = await fetch('/api/trades?limit=100');
        if (res.ok) {
          const data = await res.json();
          setTrades(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchTrades();
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setSortDir(prev => (sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'));
    setSortField(field);
  }, [sortField]);

  const sortedTrades = [...trades].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'createdAt':
        return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'action':
        return dir * a.action.localeCompare(b.action);
      case 'symbol':
        return dir * a.symbol.localeCompare(b.symbol);
      case 'filledPrice':
        return dir * ((a.filledPrice ?? 0) - (b.filledPrice ?? 0));
      case 'filledQty':
        return dir * ((a.filledQty ?? a.requestedNotional ?? 0) - (b.filledQty ?? b.requestedNotional ?? 0));
      case 'realizedPnl':
        return dir * ((a.realizedPnl ?? 0) - (b.realizedPnl ?? 0));
      case 'realizedPnlPct':
        return dir * ((a.realizedPnlPct ?? 0) - (b.realizedPnlPct ?? 0));
      case 'compositeScore':
        return dir * ((a.prediction?.compositeScore ?? 0) - (b.prediction?.compositeScore ?? 0));
      case 'status':
        return dir * a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const handleRowClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setModalOpen(true);
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return <span className="ml-1 text-xs">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {['Date', 'Action', 'Symbol', 'Price', 'Qty/Notional', 'P&L', 'P&L%', 'Score', 'Status'].map(h => (
                <TableHead key={h} className="text-xs">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 9 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm border border-border rounded-lg">
        No trades found.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                Date{sortIndicator('createdAt')}
              </TableHead>
              <TableHead className="text-xs cursor-pointer select-none" onClick={() => handleSort('action')}>
                Action{sortIndicator('action')}
              </TableHead>
              <TableHead className="text-xs cursor-pointer select-none" onClick={() => handleSort('symbol')}>
                Symbol{sortIndicator('symbol')}
              </TableHead>
              <TableHead className="text-xs cursor-pointer select-none text-right" onClick={() => handleSort('filledPrice')}>
                Price{sortIndicator('filledPrice')}
              </TableHead>
              <TableHead className="text-xs cursor-pointer select-none text-right" onClick={() => handleSort('filledQty')}>
                Qty/Notional{sortIndicator('filledQty')}
              </TableHead>
              <TableHead className="text-xs cursor-pointer select-none text-right" onClick={() => handleSort('realizedPnl')}>
                P&L{sortIndicator('realizedPnl')}
              </TableHead>
              <TableHead className="text-xs cursor-pointer select-none text-right" onClick={() => handleSort('realizedPnlPct')}>
                P&L%{sortIndicator('realizedPnlPct')}
              </TableHead>
              <TableHead className="text-xs cursor-pointer select-none text-right" onClick={() => handleSort('compositeScore')}>
                Score{sortIndicator('compositeScore')}
              </TableHead>
              <TableHead className="text-xs cursor-pointer select-none" onClick={() => handleSort('status')}>
                Status{sortIndicator('status')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTrades.map(trade => (
              <TableRow
                key={trade.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(trade)}
              >
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(trade.createdAt).toLocaleDateString()}{' '}
                  <span className="text-muted-foreground/60">
                    {new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      trade.action === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : trade.action === 'SELL'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-zinc-500/20 text-zinc-400'
                    }
                  >
                    {trade.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium">{trade.symbol}</TableCell>
                <TableCell className="text-xs text-right font-mono">
                  {trade.filledPrice != null ? `$${trade.filledPrice.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-xs text-right font-mono">
                  {trade.filledQty != null
                    ? trade.filledQty.toFixed(6)
                    : trade.requestedNotional != null
                      ? `$${trade.requestedNotional.toFixed(2)}`
                      : '-'}
                </TableCell>
                <TableCell
                  className={`text-xs text-right font-mono ${
                    trade.realizedPnl != null
                      ? trade.realizedPnl >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {trade.realizedPnl != null ? `$${trade.realizedPnl.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell
                  className={`text-xs text-right font-mono ${
                    trade.realizedPnlPct != null
                      ? trade.realizedPnlPct >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {trade.realizedPnlPct != null ? `${(trade.realizedPnlPct * 100).toFixed(2)}%` : '-'}
                </TableCell>
                <TableCell className="text-xs text-right font-mono">
                  {trade.prediction
                    ? (
                        <span className={trade.prediction.compositeScore >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {trade.prediction.compositeScore.toFixed(3)}
                        </span>
                      )
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      trade.status === 'FILLED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : trade.status === 'PENDING' || trade.status === 'PARTIALLY_FILLED'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                    }
                  >
                    {trade.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TradeDetailModal
        trade={selectedTrade}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
