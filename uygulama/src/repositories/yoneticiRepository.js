const { okumaHavuzu, yazmaHavuzu } = require('../config/db');

const MENU_RAPORU = `
  SELECT d.menu_id, d.tarih, d.yemekhane_id, d.ogun_id,
         d.kapasite, d.rezerve, d.bos_yer, d.doluluk_yuzde,
         NOW() < d.rezervasyon_son AS duzenlenebilir,
         m.ogrenci_fiyati, m.personel_fiyati,
         p.ortalama_puan, p.oy_sayisi
    FROM v_menu_doluluk d
    JOIN menuler m     ON m.id = d.menu_id
    JOIN v_menu_puan p ON p.menu_id = d.menu_id`;

async function haftalikRapor(yemekhaneId, ogunId, baslangic, bitis) {
  const [satirlar] = await okumaHavuzu.query(
    `${MENU_RAPORU}
      WHERE d.yemekhane_id = ? AND d.ogun_id = ? AND d.tarih BETWEEN ? AND ?
      ORDER BY d.tarih`,
    [yemekhaneId, ogunId, baslangic, bitis]
  );
  return satirlar;
}

async function haftalikMenuYemekleri(yemekhaneId, ogunId, baslangic, bitis) {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT menu_id, yemek_id, yemek
       FROM v_menu_detay
      WHERE yemekhane_id = ? AND ogun_id = ? AND tarih BETWEEN ? AND ?
      ORDER BY tarih, kategori_sira, yemek`,
    [yemekhaneId, ogunId, baslangic, bitis]
  );
  return satirlar;
}

async function haftalikOzet(yemekhaneId, baslangic, bitis) {
  const [[ozet]] = await okumaHavuzu.query(
    `SELECT COUNT(*)                     AS menu_sayisi,
            COALESCE(SUM(d.rezerve), 0)  AS rezervasyon,
            ROUND(AVG(d.doluluk_yuzde), 1) AS ortalama_doluluk,
            (SELECT ROUND(AVG(dg.puan), 1)
               FROM degerlendirmeler dg
               JOIN menuler mm ON mm.id = dg.menu_id
              WHERE mm.yemekhane_id = ? AND mm.tarih BETWEEN ? AND ?) AS ortalama_puan
       FROM v_menu_doluluk d
      WHERE d.yemekhane_id = ? AND d.tarih BETWEEN ? AND ?`,
    [yemekhaneId, baslangic, bitis, yemekhaneId, baslangic, bitis]
  );
  return ozet;
}

async function yemekleriGetir() {
  const [satirlar] = await okumaHavuzu.query(
    `SELECT k.id AS kategori_id, k.ad AS kategori,
            y.id, y.ad, y.kalori, y.vejetaryen
       FROM yemekler y
       JOIN yemek_kategorileri k ON k.id = y.kategori_id
      ORDER BY k.sira, y.ad`
  );
  return satirlar;
}

async function islemIcinde(isler) {
  const baglanti = await yazmaHavuzu.getConnection();
  try {
    await baglanti.beginTransaction();
    const sonuc = await isler(baglanti);
    await baglanti.commit();
    return sonuc;
  } catch (hata) {
    await baglanti.rollback();
    throw hata;
  } finally {
    baglanti.release();
  }
}

async function yemekhaneVarMi(baglanti, yemekhaneId) {
  const [satirlar] = await baglanti.query('SELECT id FROM yemekhaneler WHERE id = ?', [yemekhaneId]);
  return satirlar.length === 1;
}

async function ogunZamani(baglanti, ogunId, tarih) {
  const [[satir]] = await baglanti.query(
    'SELECT NOW() < TIMESTAMP(?, son_saat) AS acik FROM ogunler WHERE id = ?',
    [tarih, ogunId]
  );
  return satir ?? null;
}

async function menuyuKilitle(baglanti, menuId) {
  const [[satir]] = await baglanti.query(
    `SELECT m.id, NOW() < TIMESTAMP(m.tarih, o.son_saat) AS acik
       FROM menuler m
       JOIN ogunler o ON o.id = m.ogun_id
      WHERE m.id = ?
        FOR UPDATE`,
    [menuId]
  );
  return satir ?? null;
}

async function bulunanYemekSayisi(baglanti, yemekIdler) {
  const [[satir]] = await baglanti.query(
    'SELECT COUNT(*) AS sayi FROM yemekler WHERE id IN (?)',
    [yemekIdler]
  );
  return satir.sayi;
}

async function menuEkle(baglanti, { yemekhaneId, ogunId, tarih, ogrenciFiyati, personelFiyati }) {
  const [sonuc] = await baglanti.query(
    `INSERT INTO menuler (yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati)
     VALUES (?, ?, ?, ?, ?)`,
    [yemekhaneId, tarih, ogunId, ogrenciFiyati, personelFiyati]
  );
  return sonuc.insertId;
}

async function fiyatlariGuncelle(baglanti, menuId, { ogrenciFiyati, personelFiyati }) {
  await baglanti.query(
    'UPDATE menuler SET ogrenci_fiyati = ?, personel_fiyati = ? WHERE id = ?',
    [ogrenciFiyati, personelFiyati, menuId]
  );
}

async function menuYemekleriniYaz(baglanti, menuId, yemekIdler) {
  await baglanti.query('DELETE FROM menu_yemekleri WHERE menu_id = ?', [menuId]);
  await baglanti.query(
    'INSERT INTO menu_yemekleri (menu_id, yemek_id) VALUES ?',
    [yemekIdler.map((yemekId) => [menuId, yemekId])]
  );
}

async function menuRaporuKaynaktan(menuId) {
  const [[menu]] = await yazmaHavuzu.query(`${MENU_RAPORU} WHERE d.menu_id = ?`, [menuId]);
  const [yemekler] = await yazmaHavuzu.query(
    `SELECT menu_id, yemek_id, yemek
       FROM v_menu_detay
      WHERE menu_id = ?
      ORDER BY kategori_sira, yemek`,
    [menuId]
  );
  return { menu, yemekler };
}

module.exports = {
  haftalikRapor,
  haftalikMenuYemekleri,
  haftalikOzet,
  yemekleriGetir,
  islemIcinde,
  yemekhaneVarMi,
  ogunZamani,
  menuyuKilitle,
  bulunanYemekSayisi,
  menuEkle,
  fiyatlariGuncelle,
  menuYemekleriniYaz,
  menuRaporuKaynaktan,
};
