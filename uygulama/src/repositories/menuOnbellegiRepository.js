const { redisIstemcisi } = require('../config/redis');

const anahtar = (yemekhaneId, tarih, ogunId) => `menu:${yemekhaneId}:${tarih}:${ogunId}`;

function gunSonunaKalanSaniye() {
  const simdi = new Date();
  const geceYarisi = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate() + 1);
  return Math.max(60, Math.ceil((geceYarisi - simdi) / 1000));
}

async function getir(yemekhaneId, tarih, ogunId) {
  const deger = await redisIstemcisi.get(anahtar(yemekhaneId, tarih, ogunId));
  return deger ? JSON.parse(deger) : null;
}

async function yaz(yemekhaneId, tarih, ogunId, satirlar) {
  const sure = gunSonunaKalanSaniye();
  await redisIstemcisi.set(anahtar(yemekhaneId, tarih, ogunId), JSON.stringify(satirlar), {
    expiration: { type: 'EX', value: sure },
  });
  return sure;
}

async function sil(yemekhaneId, tarih, ogunId) {
  return redisIstemcisi.del(anahtar(yemekhaneId, tarih, ogunId));
}

module.exports = { anahtar, getir, yaz, sil };
