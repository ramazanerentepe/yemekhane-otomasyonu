const { okumaHavuzu, yazmaHavuzu } = require('../config/db');

async function yemekhaneleriGetir() {
  const [satirlar] = await okumaHavuzu.query(
    'SELECT id, ad, konum FROM yemekhaneler ORDER BY id'
  );
  return satirlar;
}

async function ogunleriGetir() {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT id, ad,
            TIME_FORMAT(son_saat, '%H:%i')         AS son_saat,
            yarim_porsiyon,
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

async function haftalikMenuleriGetir(kullaniciId, yemekhaneId, ogunId, baslangic, bitis) {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT d.menu_id, d.tarih, m.ogrenci_fiyati, m.personel_fiyati,
            o.yarim_porsiyon,
            fn_porsiyon_ucreti(m.ogrenci_fiyati, 'yarim')  AS ogrenci_yarim_fiyati,
            fn_porsiyon_ucreti(m.personel_fiyati, 'yarim') AS personel_yarim_fiyati,
            d.bos_yer, NOW() < d.rezervasyon_son AS rezervasyon_acik,
            p.ortalama_puan, p.oy_sayisi,
            r.id AS rezervasyon_id, r.durum AS rezervasyon_durumu, r.porsiyon AS rezervasyon_porsiyonu,
            dg.puan AS benim_puanim, dg.yorum AS benim_yorumum,
            EXISTS (
              SELECT 1
                FROM menu_yemekleri my
                JOIN yemek_alerjenleri ya    ON ya.yemek_id = my.yemek_id
                JOIN kullanici_alerjenleri ka ON ka.alerjen_id = ya.alerjen_id
               WHERE my.menu_id = d.menu_id AND ka.kullanici_id = ?
            ) AS alerjen_uyarisi
       FROM v_menu_doluluk d
       JOIN menuler m     ON m.id = d.menu_id
       JOIN ogunler o     ON o.id = d.ogun_id
       JOIN v_menu_puan p ON p.menu_id = d.menu_id
       LEFT JOIN rezervasyonlar r
              ON r.menu_id = d.menu_id
             AND r.kullanici_id = ?
             AND r.durum IN ('aktif', 'kullanildi')
       LEFT JOIN degerlendirmeler dg
              ON dg.menu_id = d.menu_id
             AND dg.kullanici_id = r.kullanici_id
      WHERE d.yemekhane_id = ? AND d.ogun_id = ? AND d.tarih BETWEEN ? AND ?
      ORDER BY d.tarih`,
    [kullaniciId, kullaniciId, yemekhaneId, ogunId, baslangic, bitis]
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
            d.ogrenci_fiyati, d.personel_fiyati, o.yarim_porsiyon,
            fn_porsiyon_ucreti(d.ogrenci_fiyati, 'yarim')  AS ogrenci_yarim_fiyati,
            fn_porsiyon_ucreti(d.personel_fiyati, 'yarim') AS personel_yarim_fiyati,
            DATE_FORMAT(d.rezervasyon_son, '%H:%i')  AS rezervasyon_son,
            TIME_FORMAT(o.servis_baslangic, '%H:%i') AS servis_baslangic,
            TIME_FORMAT(o.servis_bitis, '%H:%i')     AS servis_bitis,
            d.yemek_id, d.yemek, d.kategori, d.kalori, d.vejetaryen, d.alerjenler, d.alerjen_idler
       FROM v_menu_detay d
       JOIN ogunler o ON o.id = d.ogun_id
      WHERE d.yemekhane_id = ? AND d.tarih = ? AND d.ogun_id = ?
      ORDER BY d.kategori_sira, d.yemek`,
    [yemekhaneId, tarih, ogunId]
  );
  return satirlar;
}

async function yorumlariGetir(menuId, havuz = okumaHavuzu) {
  const [satirlar] = await havuz.query(
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

const yorumlariKaynaktanGetir = (menuId) => yorumlariGetir(menuId, yazmaHavuzu);

module.exports = {
  yemekhaneleriGetir,
  ogunleriGetir,
  haftaAraligiGetir,
  haftalikMenuleriGetir,
  haftalikYemekleriGetir,
  gununMenusunuGetir,
  yorumlariGetir,
  yorumlariKaynaktanGetir,
};
