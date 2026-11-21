import { ApplicationFailure, log, proxyActivities } from '@temporalio/workflow';
import { dedupeByCheapest } from '../domain/offers';
import type { HotelOffer, SupplierId } from '../domain/types';
import type { Activities } from './activities';

const { fetchSupplierHotels, saveOffers } = proxyActivities<Activities>({
  startToCloseTimeout: '10 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '500 milliseconds',
    backoffCoefficient: 2,
  },
});

const SUPPLIERS: SupplierId[] = ['supplierA', 'supplierB'];

const reasonOf = (err: unknown) => {
  const e = err as { message?: string; cause?: { message?: string } };
  return e.cause?.message ?? e.message ?? 'unknown error';
};

export async function hotelOffersWorkflow(city: string): Promise<HotelOffer[]> {
  const results = await Promise.allSettled(SUPPLIERS.map((supplier) => fetchSupplierHotels(supplier, city)));

  const responses: HotelOffer[][] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      responses.push(result.value);
    } else {
      log.error(`${SUPPLIERS[i]} failed, continuing without it`, { city, reason: reasonOf(result.reason) });
    }
  });

  if (responses.length === 0) {
    throw ApplicationFailure.nonRetryable('Both suppliers failed', 'SuppliersUnavailable');
  }

  const offers = dedupeByCheapest(responses.flat());
  await saveOffers(city, offers);
  return offers;
}
