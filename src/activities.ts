import { ApplicationFailure } from '@temporalio/common';
import { log } from '@temporalio/activity';
import { config } from '../config';
import { supplierLabels } from '../data/suppliers';
import type { HotelOffer, SupplierHotel, SupplierId } from '../domain/types';
import type { OfferStore } from '../services/offerStore';

const SUPPLIER_TIMEOUT_MS = 3000;

export function createActivities(store: OfferStore) {
  return {
    async fetchSupplierHotels(supplier: SupplierId, city: string): Promise<HotelOffer[]> {
      const url = `${config.supplierBaseUrl}/${supplier}/hotels?city=${encodeURIComponent(city)}`;

      let res: Response;
      try {
        res = await fetch(url, { signal: AbortSignal.timeout(SUPPLIER_TIMEOUT_MS) });
      } catch (err) {
        log.warn(`${supplier} request failed`, { city, error: (err as Error).message });
        throw err;
      }

      if (!res.ok) {
        const message = `${supplier} responded with ${res.status}`;
        log.warn(message, { city });
        throw res.status >= 500 ? new Error(message) : ApplicationFailure.nonRetryable(message);
      }

      const hotels = (await res.json()) as SupplierHotel[];
      log.info(`${supplier} returned ${hotels.length} hotels`, { city });

      return hotels.map(({ name, price, commissionPct }) => ({
        name,
        price,
        supplier: supplierLabels[supplier],
        commissionPct,
      }));
    },

    async saveOffers(city: string, offers: HotelOffer[]): Promise<void> {
      await store.save(city, offers);
      log.info(`saved ${offers.length} offers`, { city });
    },
  };
}

export type Activities = ReturnType<typeof createActivities>;
