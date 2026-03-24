import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
      select: {
        lastEngineRun: true,
        lastEngineStatus: true,
        lastEngineMessage: true,
      },
    });

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
