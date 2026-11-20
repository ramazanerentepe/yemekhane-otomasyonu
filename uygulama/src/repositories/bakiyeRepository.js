const { okumaHavuzu, yazmaHavuzu } = require('../config/db');

async function bakiyeGetir(kullaniciId) {
  const [satirlar] = await okumaHavuzu.query(
    'SELECT bakiye FROM kullanicilar WHERE id = ?',
    [kullaniciId]
  );
  return satirlar[0]?.bakiye ?? 0;
}

async function hareketToplamlari(kullaniciId) {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT tur, SUM(tutar) AS toplam
       FROM bakiye_hareketleri
      WHERE kullanici_id = ?
      GROUP BY tur`,
    [kullaniciId]
  );
  return satirlar;
}

async function hareketleriGetir(kullaniciId) {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT h.id, h.tur, h.tutar, h.aciklama,
            DATE_FORMAT(h.olusturma, '%Y-%m-%d %H:%i') AS zaman,
            m.tarih AS menu_tarihi, o.ad AS ogun, yh.ad AS yemekhane
       FROM bakiye_hareketleri h
       LEFT JOIN rezervasyonlar r  ON r.id = h.rezervasyon_id
       LEFT JOIN menuler m         ON m.id = r.menu_id
       LEFT JOIN ogunler o         ON o.id = m.ogun_id
       LEFT JOIN yemekhaneler yh   ON yh.id = m.yemekhane_id
      WHERE h.kullanici_id = ?
      ORDER BY h.olusturma DESC, h.id DESC
      LIMIT 200`,
    [kullaniciId]
  );
  return satirlar;
}

async function bakiyeYukle(kullaniciId, tutar) {
  const [sonuclar] = await yazmaHavuzu.query('CALL sp_bakiye_yukle(?, ?)', [kullaniciId, tutar]);
  return sonuclar[0][0];
}

module.exports = { bakiyeGetir, hareketToplamlari, hareketleriGetir, bakiyeYukle };
