const { createClient } = require('redis');

const redisIstemcisi = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

redisIstemcisi.on('error', (hata) => {
  console.error('[redis]', hata.message);
});

module.exports = { redisIstemcisi };
