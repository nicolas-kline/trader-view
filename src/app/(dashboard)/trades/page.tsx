import { TradesTable } from '@/components/trades/trades-table';

export default function TradesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Trade History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and analyze your executed trades with prediction scores and outcomes.
          </p>
        </div>
        <TradesTable />
      </div>
    </div>
  );
}
