import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      mode: 'PAPER',
      tradeFrequencyHours: 24,
      buyThreshold: 0.3,
      sellThreshold: -0.3,
      maxPositionPct: 0.95,
      minTradeUsd: 10.0,
      signalWeights: {
        macd: 0.20,
        rsi: 0.15,
        fear_greed: 0.12,
        news_sentiment: 0.10,
        bollinger: 0.10,
        vix: 0.08,
        coingecko_momentum: 0.08,
        volume_trend: 0.07,
        gas_fees: 0.05,
        fed_rate: 0.03,
        treasury_spread: 0.02,
      },
      enabledSignals: [
        'macd', 'rsi', 'fear_greed', 'news_sentiment', 'bollinger',
        'vix', 'coingecko_momentum', 'volume_trend', 'gas_fees',
        'fed_rate', 'treasury_spread',
      ],
    },
  });
  console.log('Seeded default settings');
}

main().catch(console.error).finally(() => prisma.$disconnect());
