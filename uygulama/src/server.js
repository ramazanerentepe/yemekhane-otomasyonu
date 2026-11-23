const app = require('./app');
const { redisIstemcisi } = require('./config/redis');

const PORT = process.env.PORT || 8000;

async function baslat() {
  await redisIstemcisi.connect();
  console.log('[uygulama] Redis bağlantısı kuruldu');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[uygulama] ${PORT} portunda dinleniyor`);
  });
}

baslat().catch((hata) => {
  console.error('[uygulama] başlatılamadı:', hata.message);
  process.exit(1);
});
