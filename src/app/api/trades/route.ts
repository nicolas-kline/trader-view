import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { TradingMode, TradeStatus } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 500);
    const mode = searchParams.get('mode') as TradingMode | null;
    const status = searchParams.get('status') as TradeStatus | null;

    const where: Record<string, unknown> = {};
    if (mode && Object.values(TradingMode).includes(mode)) {
      where.mode = mode;
    }
    if (status && Object.values(TradeStatus).includes(status)) {
      where.status = status;
    }

    const trades = await prisma.trade.findMany({
      where,
      include: { prediction: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(trades);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
