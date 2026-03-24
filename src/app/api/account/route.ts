import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { AlpacaClient } from '@/lib/trader/alpaca-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.settings.findUniqueOrThrow({
      where: { id: 'singleton' },
    });

    const client = new AlpacaClient(settings.mode);
    const [account, ethPosition, ethPrice] = await Promise.all([
      client.getAccount(),
      client.getEthPosition(),
      client.getLatestEthPrice(),
    ]);

    return NextResponse.json({
      mode: settings.mode,
      equity: parseFloat(account.equity),
      cash: parseFloat(account.cash),
      buyingPower: parseFloat(account.buying_power),
      ethPrice,
      position: ethPosition
        ? {
            qty: parseFloat(ethPosition.qty),
            avgEntry: parseFloat(ethPosition.avg_entry_price),
            marketValue: parseFloat(ethPosition.market_value),
            unrealizedPl: parseFloat(ethPosition.unrealized_pl),
            unrealizedPlPct: parseFloat(ethPosition.unrealized_plpc),
            currentPrice: parseFloat(ethPosition.current_price),
            side: ethPosition.side,
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
