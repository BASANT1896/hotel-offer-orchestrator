import { Router } from 'express';
import { catalogs } from '../data/suppliers';
import type { SupplierId } from '../domain/types';
import { HttpError } from '../errors';

const SUPPLIER_IDS = Object.keys(catalogs) as SupplierId[];
const isSupplierId = (value: string): value is SupplierId => SUPPLIER_IDS.includes(value as SupplierId);

const outages = new Set<SupplierId>();

export function suppliersRouter() {
  const router = Router();

  for (const id of SUPPLIER_IDS) {
    router.get(`/${id}/hotels`, (req, res) => {
      if (outages.has(id)) {
        throw new HttpError(503, `${id} is unavailable`);
      }

      const city = typeof req.query.city === 'string' ? req.query.city.trim().toLowerCase() : '';
      if (!city) {
        throw new HttpError(400, 'city is required');
      }

      res.json(catalogs[id].filter((hotel) => hotel.city === city));
    });
  }

  router.put('/mock/suppliers/:id', (req, res) => {
    const { id } = req.params;
    if (!isSupplierId(id)) {
      throw new HttpError(404, `unknown supplier ${id}`);
    }
    if (typeof req.body?.down !== 'boolean') {
      throw new HttpError(400, 'body must be { "down": true | false }');
    }

    if (req.body.down) outages.add(id);
    else outages.delete(id);

    res.json({ supplier: id, down: outages.has(id) });
  });

  return router;
}
