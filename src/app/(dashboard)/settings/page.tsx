import { ModeToggle } from '@/components/settings/mode-toggle';
import { FrequencyConfig } from '@/components/settings/frequency-config';
import { ThresholdConfig } from '@/components/settings/threshold-config';
import { ApiStatus } from '@/components/settings/api-status';
import { SignalWeightEditor } from '@/components/settings/signal-weight-editor';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure trading parameters, signal weights, and API connections.
          </p>
        </div>

        <div className="space-y-8">
          {/* Trading Mode */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Trading Mode</h2>
            <ModeToggle />
          </section>

          <Separator />

          {/* Trade Configuration */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Trade Configuration</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FrequencyConfig />
              <ThresholdConfig />
            </div>
          </section>

          <Separator />

          {/* Signal Weights */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Signal Configuration</h2>
            <SignalWeightEditor />
          </section>

          <Separator />

          {/* API Status */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Connections</h2>
            <ApiStatus />
          </section>
        </div>
      </div>
    </div>
  );
}
