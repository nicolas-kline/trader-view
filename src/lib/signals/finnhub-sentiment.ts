import { BaseSignal } from './base-signal';
import { SignalResult, SIGNAL_NAMES } from './types';

interface FinnhubNewsArticle {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

const POSITIVE_WORDS = [
  'rally',
  'surge',
  'bull',
  'gain',
  'up',
  'rise',
  'high',
  'record',
  'adoption',
  'growth',
  'bullish',
  'soar',
];

const NEGATIVE_WORDS = [
  'crash',
  'drop',
  'bear',
  'loss',
  'down',
  'fall',
  'low',
  'fear',
  'sell',
  'dump',
  'bearish',
  'plunge',
];

function scoreArticle(article: FinnhubNewsArticle): number {
  const text = `${article.headline} ${article.summary}`.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of POSITIVE_WORDS) {
    // Match whole words using a simple boundary check
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) positiveCount += matches.length;
  }

  for (const word of NEGATIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) negativeCount += matches.length;
  }

  return (positiveCount - negativeCount) / (positiveCount + negativeCount + 1);
}

export class FinnhubSentimentSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.NEWS_SENTIMENT;
  source = 'finnhub';

  async fetch(): Promise<SignalResult> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      throw new Error('Missing FINNHUB_API_KEY environment variable');
    }

    const url = `https://finnhub.io/api/v1/news?category=crypto&token=${apiKey}`;

    const articles = (await this.fetchJson(url)) as FinnhubNewsArticle[];

    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('No news articles returned from Finnhub');
    }

    // Score the last 20 articles (or fewer if not available)
    const recentArticles = articles.slice(0, 20);
    const scores = recentArticles.map(scoreArticle);
    const avgScore =
      scores.reduce((sum, s) => sum + s, 0) / scores.length;

    const normalizedValue = this.clamp(avgScore, -1, 1);

    return {
      name: this.name,
      rawValue: avgScore,
      normalizedValue,
      confidence: 0.5,
      source: this.source,
      metadata: {
        articlesScored: recentArticles.length,
        avgScore,
        scores,
      },
      fetchedAt: new Date(),
    };
  }
}
