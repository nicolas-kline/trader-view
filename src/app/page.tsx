import { EquityCurve } from "@/components/dashboard/equity-curve";
import { PositionCard } from "@/components/dashboard/position-card";
import { PnlSummary } from "@/components/dashboard/pnl-summary";
import { SignalOverview } from "@/components/dashboard/signal-overview";
import { EngineStatus } from "@/components/dashboard/engine-status";
import { RecentTrades } from "@/components/dashboard/recent-trades";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <EquityCurve />
      </div>
      <div>
        <PositionCard />
      </div>
      <div>
        <PnlSummary />
      </div>
      <div>
        <EngineStatus />
      </div>
      <div>
        <SignalOverview />
      </div>
      <div className="lg:col-span-3">
        <RecentTrades />
      </div>
    </div>
  );
}
