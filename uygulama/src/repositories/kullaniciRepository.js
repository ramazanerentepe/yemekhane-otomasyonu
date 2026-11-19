const { okumaHavuzu } = require('../config/db' );

async function epostaIleBul(eposta) {
  const [satirlar] = await okumaHavuzu.query(
    'SELECT id, ad, soyad, eposta, sifre_hash, rol, aktif FROM kullanicilar WHERE eposta = ?',
    [eposta]
  );
  return satirlar[0] || null;
}

async function idIleBul(id) {
  const [satirlar] = await okumaHavuzu.query(
    'SELECT id, ad, soyad, eposta, rol, ogrenci_no, bakiye FROM kullanicilar WHERE id = ?',
    [id]
  );
  return satirlar[0] || null;
}

module.exports = { epostaIleBul, idIleBul };