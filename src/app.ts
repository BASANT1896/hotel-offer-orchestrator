import express, { type ErrorRequestHandler } from 'express';
import { HttpError } from './errors';
import { logger } from './logger';
import { healthRouter } from './routes/health';
import { hotelsRouter } from './routes/hotels';
import { suppliersRouter } from './routes/suppliers';
import type { OfferStore } from './services/offerStore';
import type { WorkflowRunner } from './temporal/client';

interface Deps {
  store: OfferStore;
  workflows: WorkflowRunner;
}

export function createApp(deps: Deps) {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
    });
    next();
  });

  app.use(healthRouter(deps));
  app.use(suppliersRouter());
  app.use('/api/hotels', hotelsRouter(deps));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    logger.error({ err }, 'unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  };
  app.use(errorHandler);

  return app;
}
