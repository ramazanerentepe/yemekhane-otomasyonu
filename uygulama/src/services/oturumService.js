const crypto = require('crypto');

const oturumlar = new Map();

async function olustur(kullanici) {
  const token = crypto.randomUUID();
  oturumlar.set(token, { kullaniciId: kullanici.id, rol: kullanici.rol });
  return token;
}

async function getir(token) {
  return oturumlar.get(token) || null;
}

async function sil(token) {
  oturumlar.delete(token);
}

module.exports = { olustur, getir, sil };