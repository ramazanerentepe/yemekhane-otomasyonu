const { okumaHavuzu, yazmaHavuzu } = require('../config/db');

async function alerjenleriGetir() {
  const [satirlar] = await okumaHavuzu.query('SELECT id, ad FROM alerjenler ORDER BY ad');
  return satirlar;
}

async function kullanicininAlerjenleri(kullaniciId, havuz = okumaHavuzu) {
  const [satirlar] = await havuz.query(
    `SELECT a.id, a.ad
       FROM kullanici_alerjenleri ka
       JOIN alerjenler a ON a.id = ka.alerjen_id
      WHERE ka.kullanici_id = ?
      ORDER BY a.ad`,
    [kullaniciId]
  );
  return satirlar;
}

const kullanicininAlerjenleriKaynaktan = (kullaniciId) => kullanicininAlerjenleri(kullaniciId, yazmaHavuzu);

async function alerjenleriKaydet(kullaniciId, alerjenIdler) {
  const baglanti = await yazmaHavuzu.getConnection();
  try {
    await baglanti.beginTransaction();
    if (alerjenIdler.length > 0) {
      const [[{ sayi }]] = await baglanti.query(
        'SELECT COUNT(*) AS sayi FROM alerjenler WHERE id IN (?)',
        [alerjenIdler]
      );
      if (sayi !== alerjenIdler.length) {
        await baglanti.rollback();
        return false;
      }
    }
    await baglanti.query('DELETE FROM kullanici_alerjenleri WHERE kullanici_id = ?', [kullaniciId]);
    if (alerjenIdler.length > 0) {
      await baglanti.query(
        'INSERT INTO kullanici_alerjenleri (kullanici_id, alerjen_id) VALUES ?',
        [alerjenIdler.map((alerjenId) => [kullaniciId, alerjenId])]
      );
    }
    await baglanti.commit();
    return true;
  } catch (hata) {
    await baglanti.rollback();
    throw hata;
  } finally {
    baglanti.release();
  }
}

module.exports = {
  alerjenleriGetir,
  kullanicininAlerjenleri,
  kullanicininAlerjenleriKaynaktan,
  alerjenleriKaydet,
};
