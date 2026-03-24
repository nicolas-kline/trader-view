import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 500);

    const predictions = await prisma.prediction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { signals: true },
      take: limit,
    });

    return NextResponse.json(predictions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
