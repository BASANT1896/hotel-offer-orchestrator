import { NativeConnection, Worker } from '@temporalio/worker';
import { config } from './config';
import { logger } from './logger';
import { createRedis } from './redis';
import { OfferStore } from './services/offerStore';
import { createActivities } from './temporal/activities';
import { retry } from './utils/async';

async function main() {
  const redis = createRedis();
  const store = new OfferStore(redis, config.offersTtlSeconds);

  const connection = await retry('temporal', () => NativeConnection.connect({ address: config.temporalAddress }));

  const worker = await Worker.create({
    connection,
    namespace: config.temporalNamespace,
    taskQueue: config.taskQueue,
    workflowsPath: require.resolve('./temporal/workflows'),
    activities: createActivities(store),
  });

  logger.info(`worker polling task queue "${config.taskQueue}"`);
  await worker.run();

  await connection.close();
  await redis.quit();
}

main().catch((err) => {
  logger.error({ err }, 'worker crashed');
  process.exit(1);
});
