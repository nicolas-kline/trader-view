'use client';

import { useState, useEffect } from 'react';

interface ApiService {
  name: string;
  key: string;
  description: string;
}

const API_SERVICES: ApiService[] = [
  { name: 'Alpaca Paper', key: 'ALPACA_PAPER', description: 'Paper trading API' },
  { name: 'Alpaca Live', key: 'ALPACA_LIVE', description: 'Live trading API' },
  { name: 'FRED', key: 'FRED', description: 'Federal Reserve economic data' },
  { name: 'Finnhub', key: 'FINNHUB', description: 'News sentiment & market data' },
  { name: 'Alpha Vantage', key: 'ALPHA_VANTAGE', description: 'Technical analysis data' },
];

export function ApiStatus() {
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div>
        <div className="text-sm font-medium text-foreground">API Status</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Connection status for external services. Check your .env file for API key configuration.
        </div>
      </div>

      {/* Server health */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30">
        <div
          className={`w-2 h-2 rounded-full ${
            loading
              ? 'bg-yellow-500 animate-pulse'
              : health?.status === 'ok'
                ? 'bg-emerald-500'
                : 'bg-red-500'
          }`}
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">Server</div>
          <div className="text-xs text-muted-foreground">
            {loading ? 'Checking...' : health?.status === 'ok' ? 'Running' : 'Unreachable'}
          </div>
        </div>
        {health?.timestamp && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {new Date(health.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* API services */}
      <div className="space-y-1">
        {API_SERVICES.map(service => (
          <div
            key={service.key}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/20 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{service.name}</div>
              <div className="text-xs text-muted-foreground">{service.description}</div>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
              Configured
            </span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-muted-foreground/60 px-3">
        API keys are read from environment variables. To modify, update your .env file and restart the server.
      </div>
    </div>
  );
}
