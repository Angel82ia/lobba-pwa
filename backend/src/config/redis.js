/**
 * Configuración de Redis para LOBBA PWA
 * Soporta: Cache, Sessions, Bull Queues
 */

const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

if (process.env.REDIS_TLS === 'true') {
  redisConfig.tls = {
    rejectUnauthorized: false,
  };
}

let redisClient = null;

/**
 * Obtiene o crea el cliente de Redis
 * @returns {Redis} Cliente de Redis
 */
function getRedisClient() {
  if (!redisClient) {
    if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('redis')) {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
        ...(process.env.REDIS_TLS === 'true' ? {
          tls: { rejectUnauthorized: false }
        } : {}),
      });
    } else {
      redisClient = new Redis(redisConfig);
    }

    redisClient.on('connect', () => {
      console.log('✅ Redis: Conectando...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis: Listo y operativo');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Error:', err.message);
    });

    redisClient.on('close', () => {
      console.log('⚠️  Redis: Conexión cerrada');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis: Reconectando...');
    });
  }

  return redisClient;
}

/**
 * Conecta a Redis
 * @returns {Promise<void>}
 */
async function connectRedis() {
  try {
    const client = getRedisClient();
    await client.connect();
    console.log('✅ Redis conectado exitosamente');
    return client;
  } catch (error) {
    console.error('❌ Error conectando a Redis:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Continuando sin Redis en desarrollo');
      return null;
    }
    
    throw error;
  }
}

/**
 * Desconecta de Redis
 * @returns {Promise<void>}
 */
async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis desconectado correctamente');
      redisClient = null;
    } catch (error) {
      console.error('❌ Error desconectando Redis:', error.message);
      await redisClient.disconnect();
      redisClient = null;
    }
  }
}

/**
 * Verifica salud de Redis
 * @returns {Promise<boolean>}
 */
async function checkRedisHealth() {
  try {
    const client = getRedisClient();
    if (!client) return false;
    
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('❌ Redis health check failed:', error.message);
    return false;
  }
}

/**
 * Cache Helper: Get
 * @param {string} key 
 * @returns {Promise<any>}
 */
async function cacheGet(key) {
  try {
    const client = getRedisClient();
    if (!client) return null;
    
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Redis cacheGet error for key ${key}:`, error.message);
    return null;
  }
}

/**
 * Cache Helper: Set
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttl - TTL en segundos (default: 1 hora)
 * @returns {Promise<boolean>}
 */
async function cacheSet(key, value, ttl = 3600) {
  try {
    const client = getRedisClient();
    if (!client) return false;
    
    const serialized = JSON.stringify(value);
    
    if (ttl > 0) {
      await client.setex(key, ttl, serialized);
    } else {
      await client.set(key, serialized);
    }
    
    return true;
  } catch (error) {
    console.error(`Redis cacheSet error for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Cache Helper: Delete
 * @param {string} key 
 * @returns {Promise<boolean>}
 */
async function cacheDel(key) {
  try {
    const client = getRedisClient();
    if (!client) return false;
    
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`Redis cacheDel error for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Cache Helper: Delete por patrón
 * @param {string} pattern - Ejemplo: "user:*"
 * @returns {Promise<number>} Número de claves eliminadas
 */
async function cacheDelPattern(pattern) {
  try {
    const client = getRedisClient();
    if (!client) return 0;
    
    const stream = client.scanStream({
      match: pattern,
      count: 100,
    });
    
    let deletedCount = 0;
    
    return new Promise((resolve, reject) => {
      stream.on('data', async (keys) => {
        if (keys.length > 0) {
          stream.pause();
          await client.del(...keys);
          deletedCount += keys.length;
          stream.resume();
        }
      });
      
      stream.on('end', () => {
        resolve(deletedCount);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Redis cacheDelPattern error for pattern ${pattern}:`, error.message);
    return 0;
  }
}

/**
 * Rate Limiting Helper
 * @param {string} key - Identificador único (ej: "rate:login:user123")
 * @param {number} maxRequests - Máximo de requests permitidos
 * @param {number} windowSeconds - Ventana de tiempo en segundos
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>}
 */
async function rateLimit(key, maxRequests, windowSeconds) {
  try {
    const client = getRedisClient();
    if (!client) {
      return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
    }
    
    const current = await client.incr(key);
    
    if (current === 1) {
      await client.expire(key, windowSeconds);
    }
    
    const ttl = await client.ttl(key);
    const resetAt = Date.now() + (ttl * 1000);
    
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetAt,
    };
  } catch (error) {
    console.error(`Redis rateLimit error for key ${key}:`, error.message);
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

module.exports = {
  getRedisClient,
  connectRedis,
  disconnectRedis,
  checkRedisHealth,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  rateLimit,
  redisConfig,
};
