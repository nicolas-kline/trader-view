'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SignalSnapshotEntry {
  raw: number;
  normalized: number;
  weight: number;
  confidence: number;
}

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
    signalSnapshot: Record<string, SignalSnapshotEntry>;
    priceAtPrediction: number;
    priceAfter1h: number | null;
    priceAfter4h: number | null;
    priceAfter24h: number | null;
    outcomeCorrect: boolean | null;
    actualReturn: number | null;
    createdAt: string;
  } | null;
}

interface TradeDetailModalProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TradeDetailModal({ trade, open, onOpenChange }: TradeDetailModalProps) {
  if (!trade) return null;

  const prediction = trade.prediction;
  const snapshot = prediction?.signalSnapshot as Record<string, SignalSnapshotEntry> | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trade Detail</DialogTitle>
          <DialogDescription>
            {trade.symbol} - {new Date(trade.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        {/* Order Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Order Details</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-muted-foreground">Action</div>
            <div>
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
            </div>
            <div className="text-muted-foreground">Status</div>
            <div>
              <Badge
                className={
                  trade.status === 'FILLED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : trade.status === 'PENDING'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                }
              >
                {trade.status}
              </Badge>
            </div>
            <div className="text-muted-foreground">Mode</div>
            <div className="text-foreground">{trade.mode}</div>
            <div className="text-muted-foreground">Symbol</div>
            <div className="text-foreground">{trade.symbol}</div>
            {trade.requestedQty != null && (
              <>
                <div className="text-muted-foreground">Requested Qty</div>
                <div className="text-foreground">{trade.requestedQty}</div>
              </>
            )}
            {trade.requestedNotional != null && (
              <>
                <div className="text-muted-foreground">Requested Notional</div>
                <div className="text-foreground">${trade.requestedNotional.toFixed(2)}</div>
              </>
            )}
            {trade.filledQty != null && (
              <>
                <div className="text-muted-foreground">Filled Qty</div>
                <div className="text-foreground">{trade.filledQty}</div>
              </>
            )}
            {trade.filledPrice != null && (
              <>
                <div className="text-muted-foreground">Filled Price</div>
                <div className="text-foreground">${trade.filledPrice.toFixed(2)}</div>
              </>
            )}
            {trade.realizedPnl != null && (
              <>
                <div className="text-muted-foreground">Realized P&L</div>
                <div className={trade.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  ${trade.realizedPnl.toFixed(2)}
                  {trade.realizedPnlPct != null && (
                    <span className="ml-1 text-xs">
                      ({(trade.realizedPnlPct * 100).toFixed(2)}%)
                    </span>
                  )}
                </div>
              </>
            )}
            {trade.orderId && (
              <>
                <div className="text-muted-foreground">Order ID</div>
                <div className="text-foreground font-mono text-xs truncate">{trade.orderId}</div>
              </>
            )}
            {trade.errorMessage && (
              <>
                <div className="text-muted-foreground">Error</div>
                <div className="text-red-400 text-xs">{trade.errorMessage}</div>
              </>
            )}
          </div>
        </div>

        {prediction && (
          <>
            <Separator />

            {/* Prediction */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Prediction</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">Composite Score</div>
                <div className={prediction.compositeScore >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {prediction.compositeScore.toFixed(4)}
                </div>
                <div className="text-muted-foreground">Confidence</div>
                <div className="text-foreground">{(prediction.confidence * 100).toFixed(1)}%</div>
                <div className="text-muted-foreground">Price at Prediction</div>
                <div className="text-foreground">${prediction.priceAtPrediction.toFixed(2)}</div>
                {prediction.priceAfter1h != null && (
                  <>
                    <div className="text-muted-foreground">Price After 1h</div>
                    <div className="text-foreground">${prediction.priceAfter1h.toFixed(2)}</div>
                  </>
                )}
                {prediction.priceAfter24h != null && (
                  <>
                    <div className="text-muted-foreground">Price After 24h</div>
                    <div className="text-foreground">${prediction.priceAfter24h.toFixed(2)}</div>
                  </>
                )}
                {prediction.outcomeCorrect != null && (
                  <>
                    <div className="text-muted-foreground">Outcome</div>
                    <div>
                      <Badge
                        className={
                          prediction.outcomeCorrect
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }
                      >
                        {prediction.outcomeCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                  </>
                )}
              </div>

              {prediction.reasoning && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Reasoning</div>
                  <div className="text-sm text-foreground bg-muted/50 rounded-md p-3 leading-relaxed">
                    {prediction.reasoning}
                  </div>
                </div>
              )}
            </div>

            {/* Signal Snapshot */}
            {snapshot && Object.keys(snapshot).length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Signal Snapshot</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Signal</TableHead>
                        <TableHead className="text-xs text-right">Raw</TableHead>
                        <TableHead className="text-xs text-right">Normalized</TableHead>
                        <TableHead className="text-xs text-right">Weight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(snapshot)
                        .sort(([, a], [, b]) => b.weight - a.weight)
                        .map(([name, entry]) => (
                          <TableRow key={name}>
                            <TableCell className="text-xs font-medium">{name}</TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {entry.raw.toFixed(4)}
                            </TableCell>
                            <TableCell
                              className={`text-xs text-right font-mono ${
                                entry.normalized >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {entry.normalized.toFixed(4)}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {(entry.weight * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
