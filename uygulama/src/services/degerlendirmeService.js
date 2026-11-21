const degerlendirmeRepository = require('../repositories/degerlendirmeRepository');
const menuRepository = require('../repositories/menuRepository');
const istekHatasi = require('../utils/istekHatasi');

async function degerlendir(kullaniciId, menuId, puan, yorum) {
  const kullanildi = await degerlendirmeRepository.kullanilmisRezervasyonVarMi(kullaniciId, menuId);
  if (!kullanildi) {
    throw istekHatasi(403, 'Yalnızca kullandığın menüleri değerlendirebilirsin.');
  }

  const islem = await degerlendirmeRepository.kaydet(kullaniciId, menuId, puan, yorum);
  const [menuPuani, yorumlar] = await Promise.all([
    degerlendirmeRepository.menuPuani(menuId),
    menuRepository.yorumlariKaynaktanGetir(menuId),
  ]);

  return {
    islem,
    mesaj: islem === 'eklendi' ? 'Değerlendirmen kaydedildi.' : 'Değerlendirmen güncellendi.',
    degerlendirme: { puan, yorum },
    ortalama_puan: menuPuani.ortalama_puan,
    oy_sayisi: menuPuani.oy_sayisi,
    yorumlar,
  };
}

module.exports = { degerlendir };
