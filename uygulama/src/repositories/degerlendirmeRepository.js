const { yazmaHavuzu } = require('../config/db');

async function kullanilmisRezervasyonVarMi(kullaniciId, menuId) {
  const [satirlar] = await yazmaHavuzu.query(
    `SELECT 1
       FROM rezervasyonlar
      WHERE kullanici_id = ? AND menu_id = ? AND durum = 'kullanildi'
      LIMIT 1`,
    [kullaniciId, menuId]
  );
  return satirlar.length > 0;
}

async function kaydet(kullaniciId, menuId, puan, yorum) {
  const [sonuc] = await yazmaHavuzu.query(
    `INSERT INTO degerlendirmeler (kullanici_id, menu_id, puan, yorum)
     VALUES (?, ?, ?, ?) AS yeni
     ON DUPLICATE KEY UPDATE puan = yeni.puan, yorum = yeni.yorum`,
    [kullaniciId, menuId, puan, yorum]
  );
  return sonuc.affectedRows === 1 ? 'eklendi' : 'guncellendi';
}

async function menuPuani(menuId) {
  const [[puan]] = await yazmaHavuzu.query(
    'SELECT oy_sayisi, ortalama_puan FROM v_menu_puan WHERE menu_id = ?',
    [menuId]
  );
  return puan;
}

module.exports = { kullanilmisRezervasyonVarMi, kaydet, menuPuani };
