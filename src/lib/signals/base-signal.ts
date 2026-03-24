import { SignalResult, SignalName } from './types';

export abstract class BaseSignal {
  abstract name: SignalName;
  abstract source: string;

  abstract fetch(): Promise<SignalResult>;

  /**
   * Fetch JSON with retry logic (3 attempts, exponential backoff).
   */
  protected async fetchJson(url: string, options?: RequestInit): Promise<unknown> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: options?.signal ?? AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status} ${response.statusText} from ${url}`
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms, 2000ms
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to fetch ${url} after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Clamp a value between min and max.
   */
  protected clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
