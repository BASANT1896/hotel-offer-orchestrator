import { Router } from 'express';
import { config } from '../config';
import type { SupplierId } from '../domain/types';
import type { OfferStore } from '../services/offerStore';
import type { WorkflowRunner } from '../temporal/client';
import { withTimeout } from '../utils/async';

type State = 'up' | 'down';

interface Deps {
  store: OfferStore;
  workflows: WorkflowRunner;
}

const PROBE_TIMEOUT_MS = 2000;

async function probe(check: () => Promise<unknown>): Promise<State> {
  try {
    await withTimeout(check(), PROBE_TIMEOUT_MS);
    return 'up';
  } catch {
    return 'down';
  }
}

async function pingSupplier(id: SupplierId) {
  const res = await fetch(`${config.supplierBaseUrl}/${id}/hotels?city=delhi`, {
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${id} responded with ${res.status}`);
}

export function healthRouter({ store, workflows }: Deps) {
  const router = Router();

  router.get('/health', async (_req, res) => {
    const [supplierA, supplierB, redis, temporal] = await Promise.all([
      probe(() => pingSupplier('supplierA')),
      probe(() => pingSupplier('supplierB')),
      probe(() => store.ping()),
      probe(() => workflows.ping()),
    ]);

    const suppliersDown = [supplierA, supplierB].filter((s) => s === 'down').length;
    const infraDown = redis === 'down' || temporal === 'down';

    const status = infraDown || suppliersDown === 2 ? 'down' : suppliersDown === 1 ? 'degraded' : 'ok';

    res.status(status === 'down' ? 503 : 200).json({
      status,
      suppliers: { supplierA, supplierB },
      redis,
      temporal,
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  return router;
}
