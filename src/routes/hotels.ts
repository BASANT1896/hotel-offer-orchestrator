import { Router } from 'express';
import { HttpError } from '../errors';
import type { OfferStore } from '../services/offerStore';
import type { WorkflowRunner } from '../temporal/client';

interface Deps {
  store: OfferStore;
  workflows: WorkflowRunner;
}

function parseCity(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'city query param is required');
  }
  return value.trim().toLowerCase();
}

function parsePrice(value: unknown, name: string): number | undefined {
  if (value === undefined || value === '') return undefined;

  const price = typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(price) || price < 0) {
    throw new HttpError(400, `${name} must be a non-negative number`);
  }
  return price;
}

export function hotelsRouter({ store, workflows }: Deps) {
  const router = Router();

  router.get('/', async (req, res) => {
    const city = parseCity(req.query.city);
    const minPrice = parsePrice(req.query.minPrice, 'minPrice');
    const maxPrice = parsePrice(req.query.maxPrice, 'maxPrice');

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new HttpError(400, 'minPrice cannot be greater than maxPrice');
    }

    await workflows.collectOffers(city);
    res.json(await store.findByPrice(city, { minPrice, maxPrice }));
  });

  return router;
}
