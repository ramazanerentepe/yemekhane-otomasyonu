const { redisIstemcisi } = require('../config/redis');

const anahtar = (yemekhaneId, tarih, ogunId) => `menu:${yemekhaneId}:${tarih}:${ogunId}`;

function menununGunSonunaKalanSaniye(tarih) {
  const [yil, ay, gun] = tarih.split('-').map(Number);
  const gunSonu = new Date(yil, ay - 1, gun + 1);
  return Math.ceil((gunSonu - Date.now()) / 1000);
}

async function getir(yemekhaneId, tarih, ogunId) {
  const deger = await redisIstemcisi.get(anahtar(yemekhaneId, tarih, ogunId));
  return deger ? JSON.parse(deger) : null;
}

async function yaz(yemekhaneId, tarih, ogunId, satirlar) {
  const sure = menununGunSonunaKalanSaniye(tarih);
  if (sure <= 0) return 0;
  await redisIstemcisi.set(anahtar(yemekhaneId, tarih, ogunId), JSON.stringify(satirlar), {
    expiration: { type: 'EX', value: sure },
  });
  return sure;
}

async function sil(yemekhaneId, tarih, ogunId) {
  return redisIstemcisi.del(anahtar(yemekhaneId, tarih, ogunId));
}

module.exports = { anahtar, getir, yaz, sil };
