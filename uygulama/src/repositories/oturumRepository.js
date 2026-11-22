const { redisIstemcisi } = require('../config/redis');

const OTURUM_SURESI = 30 * 60;

const anahtar = (token) => `oturum:${token}`;

async function kaydet(token, oturum) {
  await redisIstemcisi.set(anahtar(token), JSON.stringify(oturum), {
    expiration: { type: 'EX', value: OTURUM_SURESI },
  });
}

async function getirVeUzat(token) {
  const deger = await redisIstemcisi.getEx(anahtar(token), { type: 'EX', value: OTURUM_SURESI });
  return deger ? JSON.parse(deger) : null;
}

async function sil(token) {
  await redisIstemcisi.del(anahtar(token));
}

module.exports = { kaydet, getirVeUzat, sil };
