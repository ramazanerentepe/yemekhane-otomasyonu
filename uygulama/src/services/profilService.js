const profilRepository = require('../repositories/profilRepository');
const kullaniciRepository = require('../repositories/kullaniciRepository');
const istekHatasi = require('../utils/istekHatasi');

function alerjenListesi(tumAlerjenler, secilenler) {
  const secili = new Set(secilenler.map((alerjen) => alerjen.id));
  return tumAlerjenler.map((alerjen) => ({ id: alerjen.id, ad: alerjen.ad, secili: secili.has(alerjen.id) }));
}

async function profil(kullaniciId) {
  const [kullanici, tumAlerjenler, secilenler] = await Promise.all([
    kullaniciRepository.idIleBul(kullaniciId),
    profilRepository.alerjenleriGetir(),
    profilRepository.kullanicininAlerjenleri(kullaniciId),
  ]);
  return { kullanici, alerjenler: alerjenListesi(tumAlerjenler, secilenler) };
}

async function alerjenleriKaydet(kullaniciId, alerjenIdler) {
  const kaydedildi = await profilRepository.alerjenleriKaydet(kullaniciId, alerjenIdler);
  if (!kaydedildi) {
    throw istekHatasi(400, 'Seçilen alerjenlerden bazıları bulunamadı.');
  }

  const [tumAlerjenler, secilenler] = await Promise.all([
    profilRepository.alerjenleriGetir(),
    profilRepository.kullanicininAlerjenleriKaynaktan(kullaniciId),
  ]);
  return { mesaj: 'Alerjenlerin kaydedildi.', alerjenler: alerjenListesi(tumAlerjenler, secilenler) };
}

module.exports = { profil, alerjenleriKaydet };
