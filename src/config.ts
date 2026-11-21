const num = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: num(process.env.PORT, 3000),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  temporalAddress: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  temporalNamespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
  taskQueue: process.env.TASK_QUEUE ?? 'hotel-offers',
  supplierBaseUrl: process.env.SUPPLIER_BASE_URL ?? 'http://localhost:3000',
  offersTtlSeconds: num(process.env.OFFERS_TTL_SECONDS, 600),
};
