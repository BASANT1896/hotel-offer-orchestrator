import { describe, expect, it } from 'vitest';
import { dedupeByCheapest } from './offers';
import type { HotelOffer } from './types';

const offer = (name: string, price: number, supplier: string, commissionPct = 10): HotelOffer => ({
  name,
  price,
  supplier,
  commissionPct,
});

describe('dedupeByCheapest', () => {
  it('keeps the cheaper offer when a hotel is listed by both suppliers', () => {
    const result = dedupeByCheapest([
      offer('Holtin', 6000, 'Supplier A'),
      offer('Holtin', 5340, 'Supplier B', 20),
    ]);

    expect(result).toEqual([offer('Holtin', 5340, 'Supplier B', 20)]);
  });

  it('keeps hotels that only one supplier returns', () => {
    const result = dedupeByCheapest([offer('Radison', 5900, 'Supplier A'), offer('Lemon Tree', 4500, 'Supplier B')]);

    expect(result.map((o) => o.name)).toEqual(['Lemon Tree', 'Radison']);
  });

  it('matches names regardless of case and surrounding spaces', () => {
    const result = dedupeByCheapest([offer('Taj Palace', 12500, 'Supplier A'), offer(' taj palace ', 11900, 'Supplier B')]);

    expect(result).toHaveLength(1);
    expect(result[0].supplier).toBe('Supplier B');
  });

  it('prefers the higher commission when prices are equal', () => {
    const result = dedupeByCheapest([offer('Holtin', 5000, 'Supplier A', 10), offer('Holtin', 5000, 'Supplier B', 15)]);

    expect(result[0].supplier).toBe('Supplier B');
  });

  it('returns an empty list for empty input', () => {
    expect(dedupeByCheapest([])).toEqual([]);
  });
});
