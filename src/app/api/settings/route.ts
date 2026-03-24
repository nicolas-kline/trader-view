import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  mode: z.enum(['PAPER', 'LIVE']).optional(),
  tradeFrequencyHours: z.number().int().min(1).max(168).optional(),
  buyThreshold: z.number().min(-1).max(1).optional(),
  sellThreshold: z.number().min(-1).max(1).optional(),
  maxPositionPct: z.number().min(0).max(1).optional(),
  minTradeUsd: z.number().min(0).optional(),
  signalWeights: z.record(z.string(), z.number()).optional(),
  enabledSignals: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateSettingsSchema.parse(body);

    const updated = await prisma.settings.update({
      where: { id: 'singleton' },
      data: parsed,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
