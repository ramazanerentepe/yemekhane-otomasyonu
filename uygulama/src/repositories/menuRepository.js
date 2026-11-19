const { okumaHavuzu } = require('../config/db');

async function yemekhaneleriGetir() {
  const [satirlar] = await okumaHavuzu.query(
    'SELECT id, ad, konum FROM yemekhaneler ORDER BY id'
  );
  return satirlar;
}

async function ogunleriGetir() {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT id, ad,
            TIME_FORMAT(servis_baslangic, '%H:%i') AS servis_baslangic,
            TIME_FORMAT(servis_bitis, '%H:%i')     AS servis_bitis
       FROM ogunler
      ORDER BY sira`
  );
  return satirlar;
}

async function haftaAraligiGetir(tarih) {
  const [[aralik]] = await okumaHavuzu.query(
    `SELECT a.bugun,
            a.referans - INTERVAL WEEKDAY(a.referans) DAY                    AS baslangic,
            a.referans - INTERVAL WEEKDAY(a.referans) DAY + INTERVAL 6 DAY   AS bitis
       FROM (SELECT CURDATE() AS bugun, COALESCE(?, CURDATE()) AS referans) a`,
    [tarih]
  );
  return aralik;
}

async function haftalikMenuleriGetir(yemekhaneId, ogunId, baslangic, bitis) {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT d.menu_id, d.tarih, m.ogrenci_fiyati, m.personel_fiyati,
            d.bos_yer, NOW() < d.rezervasyon_son AS rezervasyon_acik,
            p.ortalama_puan, p.oy_sayisi
       FROM v_menu_doluluk d
       JOIN menuler m     ON m.id = d.menu_id
       JOIN v_menu_puan p ON p.menu_id = d.menu_id
      WHERE d.yemekhane_id = ? AND d.ogun_id = ? AND d.tarih BETWEEN ? AND ?
      ORDER BY d.tarih`,
    [yemekhaneId, ogunId, baslangic, bitis]
  );
  return satirlar;
}

async function haftalikYemekleriGetir(yemekhaneId, ogunId, baslangic, bitis) {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT menu_id, yemek
       FROM v_menu_detay
      WHERE yemekhane_id = ? AND ogun_id = ? AND tarih BETWEEN ? AND ?
      ORDER BY tarih, kategori_sira, yemek`,
    [yemekhaneId, ogunId, baslangic, bitis]
  );
  return satirlar;
}

async function gununMenusunuGetir(yemekhaneId, tarih, ogunId) {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT d.menu_id, d.tarih, d.yemekhane, d.ogun,
            d.ogrenci_fiyati, d.personel_fiyati,
            DATE_FORMAT(d.rezervasyon_son, '%H:%i')  AS rezervasyon_son,
            TIME_FORMAT(o.servis_baslangic, '%H:%i') AS servis_baslangic,
            TIME_FORMAT(o.servis_bitis, '%H:%i')     AS servis_bitis,
            d.yemek_id, d.yemek, d.kategori, d.kalori, d.vejetaryen, d.alerjenler
       FROM v_menu_detay d
       JOIN ogunler o ON o.id = d.ogun_id
      WHERE d.yemekhane_id = ? AND d.tarih = ? AND d.ogun_id = ?
      ORDER BY d.kategori_sira, d.yemek`,
    [yemekhaneId, tarih, ogunId]
  );
  return satirlar;
}

async function yorumlariGetir(menuId) {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT d.id, d.puan, d.yorum,
            CONCAT(k.ad, ' ', LEFT(k.soyad, 1), '.') AS kullanici
       FROM degerlendirmeler d
       JOIN kullanicilar k ON k.id = d.kullanici_id
      WHERE d.menu_id = ?
      ORDER BY d.olusturma DESC`,
    [menuId]
  );
  return satirlar;
}

module.exports = {
  yemekhaneleriGetir,
  ogunleriGetir,
  haftaAraligiGetir,
  haftalikMenuleriGetir,
  haftalikYemekleriGetir,
  gununMenusunuGetir,
  yorumlariGetir,
};
