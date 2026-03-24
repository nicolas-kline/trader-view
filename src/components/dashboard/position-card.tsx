'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccount } from '@/hooks/use-account';

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm tabular-nums ${valueClass ?? 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function PositionCard() {
  const { account, loading } = useAccount();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Position</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!account || !account.position) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Position</CardTitle>
        </CardHeader>
        <CardContent>
          <StatRow label="Equity" value={account ? `$${fmt(account.equity)}` : '—'} />
          <StatRow label="Cash" value={account ? `$${fmt(account.cash)}` : '—'} />
          <StatRow label="ETH Price" value={account ? `$${fmt(account.ethPrice)}` : '—'} />
          <p className="text-sm text-muted-foreground mt-3">No open ETH position</p>
        </CardContent>
      </Card>
    );
  }

  const pos = account.position;
  const pnlColor = pos.unrealizedPl >= 0 ? 'text-trading-green' : 'text-trading-red';
  const pnlSign = pos.unrealizedPl >= 0 ? '+' : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Position</span>
          <span className="text-xs font-mono text-muted-foreground uppercase">{pos.side}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatRow label="ETH Quantity" value={pos.qty.toFixed(6)} />
        <StatRow label="Market Value" value={`$${fmt(pos.marketValue)}`} />
        <StatRow label="Avg Entry" value={`$${fmt(pos.avgEntry)}`} />
        <StatRow label="ETH Price" value={`$${fmt(account.ethPrice)}`} />
        <StatRow label="Cash" value={`$${fmt(account.cash)}`} />
        <StatRow
          label="Unrealized P&L"
          value={`${pnlSign}$${fmt(Math.abs(pos.unrealizedPl))} (${pnlSign}${(pos.unrealizedPlPct * 100).toFixed(2)}%)`}
          valueClass={pnlColor}
        />
      </CardContent>
    </Card>
  );
}
