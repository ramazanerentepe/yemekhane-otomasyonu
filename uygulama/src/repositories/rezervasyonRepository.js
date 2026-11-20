const { okumaHavuzu, yazmaHavuzu } = require('../config/db');

async function kullanicininRezervasyonlari(kullaniciId) {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT r.id, r.durum, r.ucret, m.id AS menu_id, m.tarih,
            m.yemekhane_id, m.ogun_id, o.ad AS ogun, yh.ad AS yemekhane,
            p.ortalama_puan, p.oy_sayisi,
            TIME_FORMAT(o.servis_baslangic, '%H:%i') AS servis_baslangic,
            TIME_FORMAT(o.servis_bitis, '%H:%i')     AS servis_bitis,
            TIME_FORMAT(o.son_saat, '%H:%i')         AS iptal_son_saat,
            r.durum = 'aktif' AND NOW() < TIMESTAMP(m.tarih, o.son_saat) AS iptal_edilebilir,
            NOW() > TIMESTAMP(m.tarih, o.servis_bitis)                   AS servis_gecti,
            (SELECT GROUP_CONCAT(y.ad ORDER BY k.sira, y.ad SEPARATOR ' · ')
               FROM menu_yemekleri my
               JOIN yemekler y           ON y.id = my.yemek_id
               JOIN yemek_kategorileri k ON k.id = y.kategori_id
              WHERE my.menu_id = m.id)                                    AS yemekler
       FROM rezervasyonlar r
       JOIN menuler m       ON m.id = r.menu_id
       JOIN ogunler o       ON o.id = m.ogun_id
       JOIN yemekhaneler yh ON yh.id = m.yemekhane_id
       JOIN v_menu_puan p   ON p.menu_id = m.id
      WHERE r.kullanici_id = ?
      ORDER BY m.tarih DESC, o.sira DESC`,
    [kullaniciId]
  );
  return satirlar;
}

async function rezervasyonYap(kullaniciId, menuId) {
  const [sonuclar] = await yazmaHavuzu.query('CALL sp_rezervasyon_yap(?, ?)', [kullaniciId, menuId]);
  return sonuclar[0][0];
}

async function rezervasyonIptal(kullaniciId, rezervasyonId) {
  const [sonuclar] = await yazmaHavuzu.query('CALL sp_rezervasyon_iptal(?, ?)', [kullaniciId, rezervasyonId]);
  return sonuclar[0][0];
}

module.exports = { kullanicininRezervasyonlari, rezervasyonYap, rezervasyonIptal };
