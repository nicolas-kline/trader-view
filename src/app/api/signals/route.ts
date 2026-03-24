import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 500);
    const name = searchParams.get('name');

    const signals = await prisma.signal.findMany({
      where: name ? { name } : undefined,
      orderBy: { fetchedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(signals);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
