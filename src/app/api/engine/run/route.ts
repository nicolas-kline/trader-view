import { NextResponse } from 'next/server';
import { runEngine } from '@/lib/worker/engine-runner';

export async function POST() {
  try {
    const result = await runEngine();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
