import Redis from 'ioredis';
import { config } from './config';
import { logger } from './logger';

export function createRedis() {
  const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 2 });
  redis.on('error', (err) => logger.error({ err: err.message }, 'redis error'));
  return redis;
}
