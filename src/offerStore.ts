import type { Redis } from 'ioredis';
import { nameKey } from '../domain/offers';
import type { HotelOffer } from '../domain/types';

export interface PriceRange {
  minPrice?: number;
  maxPrice?: number;
}

export class OfferStore {
  constructor(
    private readonly redis: Redis,
    private readonly ttlSeconds: number,
  ) {}

  private priceIndex(city: string) {
    return `hotels:${city}:prices`;
  }

  private details(city: string) {
    return `hotels:${city}:offers`;
  }

  async save(city: string, offers: HotelOffer[]): Promise<void> {
    const index = this.priceIndex(city);
    const details = this.details(city);

    const tx = this.redis.multi().del(index, details);
    for (const offer of offers) {
      const key = nameKey(offer.name);
      tx.zadd(index, offer.price, key);
      tx.hset(details, key, JSON.stringify(offer));
    }
    tx.expire(index, this.ttlSeconds).expire(details, this.ttlSeconds);

    const results = await tx.exec();
    const failed = results?.find(([err]) => err);
    if (!results || failed) {
      throw failed?.[0] ?? new Error('Redis transaction was discarded');
    }
  }

  async findByPrice(city: string, { minPrice, maxPrice }: PriceRange = {}): Promise<HotelOffer[]> {
    const keys = await this.redis.zrangebyscore(this.priceIndex(city), minPrice ?? '-inf', maxPrice ?? '+inf');
    if (keys.length === 0) return [];

    const rows = await this.redis.hmget(this.details(city), ...keys);
    return rows.flatMap((row) => (row ? [JSON.parse(row) as HotelOffer] : []));
  }

  ping() {
    return this.redis.ping();
  }
}
