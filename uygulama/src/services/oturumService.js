const crypto = require('crypto');
const oturumRepository = require('../repositories/oturumRepository');

const TOKEN_BICIMI = /^[0-9a-f-]{36}$/;

async function olustur(kullanici) {
  const token = crypto.randomUUID();
  await oturumRepository.kaydet(token, { kullaniciId: kullanici.id, rol: kullanici.rol });
  return token;
}

async function getir(token) {
  if (!TOKEN_BICIMI.test(token)) return null;
  return oturumRepository.getirVeUzat(token);
}

async function sil(token) {
  await oturumRepository.sil(token);
}

module.exports = { olustur, getir, sil };
