import type { HotelOffer } from './types';

export const nameKey = (name: string) => name.trim().toLowerCase();

const beats = (candidate: HotelOffer, current: HotelOffer) =>
  candidate.price < current.price ||
  (candidate.price === current.price && candidate.commissionPct > current.commissionPct);

export function dedupeByCheapest(offers: HotelOffer[]): HotelOffer[] {
  const best = new Map<string, HotelOffer>();

  for (const offer of offers) {
    const key = nameKey(offer.name);
    const current = best.get(key);
    if (!current || beats(offer, current)) {
      best.set(key, offer);
    }
  }

  return [...best.values()].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
}
