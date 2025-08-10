// src/infrastructure/utils/redisClient.ts
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redis: Redis;

const {
  REDIS_URL,
  REDIS_HOST = 'my-redis',
  REDIS_PORT = '6379',
} = process.env;

if (REDIS_URL) {
  console.log('✅ Using Redis URL:', REDIS_URL);
  redis = new Redis(REDIS_URL);
} else {
  const port = parseInt(REDIS_PORT, 10);

  console.log(`✅ Connecting to Redis at ${REDIS_HOST}:${port}`);
  redis = new Redis({
    host: REDIS_HOST,
    port,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      console.warn(`⏳ Redis reconnect attempt #${times}, retrying in ${delay}ms`);
      return delay;
    },
  });
}

redis.on('connect', () => {
  console.log('✅ Redis connection established');
});

redis.on('ready', async () => {
  console.log('🚀 Redis is ready to use');

  try {
    await redis.flushall();
    console.log('🧹 Redis cache cleared on startup');
  } catch (err) {
    console.error('❌ Failed to flush Redis on startup:', err);
  }
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redis.on('close', () => {
  console.warn('⚠️ Redis connection closed');
});

redis.on('reconnecting', () => {
  console.info('🔄 Attempting to reconnect to Redis...');
});

export default redis;
