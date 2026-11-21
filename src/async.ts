import { logger } from '../logger';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function retry<T>(label: string, fn: () => Promise<T>, attempts = 30, delayMs = 2000): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= attempts) throw err;
      logger.warn({ err: (err as Error).message }, `${label} not ready (attempt ${attempt}/${attempts}), retrying`);
      await sleep(delayMs);
    }
  }
}
