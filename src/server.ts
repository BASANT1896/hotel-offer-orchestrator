import { createApp } from './app';
import { config } from './config';
import { logger } from './logger';
import { createRedis } from './redis';
import { OfferStore } from './services/offerStore';
import { createWorkflowRunner } from './temporal/client';

async function main() {
  const redis = createRedis();
  const store = new OfferStore(redis, config.offersTtlSeconds);
  const workflows = await createWorkflowRunner();

  const server = createApp({ store, workflows }).listen(config.port, () => {
    logger.info(`api listening on port ${config.port}`);
  });

  const shutdown = () => {
    logger.info('shutting down');
    server.close(() => {
      redis.quit().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'failed to start api');
  process.exit(1);
});
