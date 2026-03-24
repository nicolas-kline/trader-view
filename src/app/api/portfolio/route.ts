import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { TradingMode } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 1000);
    const mode = searchParams.get('mode') as TradingMode | null;

    const where: Record<string, unknown> = {};
    if (mode && Object.values(TradingMode).includes(mode)) {
      where.mode = mode;
    }

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where,
      orderBy: { snapshotAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
