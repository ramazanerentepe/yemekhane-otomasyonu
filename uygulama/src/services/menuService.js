const menuRepository = require('../repositories/menuRepository');
const istekHatasi = require('../utils/istekHatasi');

const roleGoreFiyat = (menu, rol) =>
  rol === 'ogrenci' ? menu.ogrenci_fiyati : menu.personel_fiyati;

function yemegiDonustur(satir) {
  return {
    id: satir.yemek_id,
    ad: satir.yemek,
    kategori: satir.kategori,
    kalori: satir.kalori,
    vejetaryen: satir.vejetaryen === 1,
    alerjenler: satir.alerjenler ? satir.alerjenler.split(', ') : [],
  };
}

async function haftalikMenu(yemekhaneId, ogunId, tarih, rol) {
  const { bugun, baslangic, bitis } = await menuRepository.haftaAraligiGetir(tarih);
  const [menuler, yemekler] = await Promise.all([
    menuRepository.haftalikMenuleriGetir(yemekhaneId, ogunId, baslangic, bitis),
    menuRepository.haftalikYemekleriGetir(yemekhaneId, ogunId, baslangic, bitis),
  ]);

  return {
    bugun,
    baslangic,
    bitis,
    menuler: menuler.map((menu) => ({
      id: menu.menu_id,
      tarih: menu.tarih,
      fiyat: roleGoreFiyat(menu, rol),
      bos_yer: menu.bos_yer,
      rezervasyon_acik: menu.rezervasyon_acik === 1,
      ortalama_puan: menu.ortalama_puan,
      oy_sayisi: menu.oy_sayisi,
      yemekler: yemekler.filter((y) => y.menu_id === menu.menu_id).map((y) => y.yemek),
    })),
  };
}

async function gununMenusu(yemekhaneId, tarih, ogunId, rol) {
  const satirlar = await menuRepository.gununMenusunuGetir(yemekhaneId, tarih, ogunId);
  if (satirlar.length === 0) {
    throw istekHatasi(404, 'Bu gün ve öğün için menü bulunmuyor.');
  }

  const menu = satirlar[0];
  const yemekler = satirlar.map(yemegiDonustur);

  return {
    id: menu.menu_id,
    tarih: menu.tarih,
    yemekhane: menu.yemekhane,
    ogun: menu.ogun,
    fiyat: roleGoreFiyat(menu, rol),
    servis_baslangic: menu.servis_baslangic,
    servis_bitis: menu.servis_bitis,
    rezervasyon_son: menu.rezervasyon_son,
    toplam_kalori: yemekler.reduce((toplam, yemek) => toplam + yemek.kalori, 0),
    vejetaryen: yemekler.every((yemek) => yemek.vejetaryen),
    yemekler,
  };
}

module.exports = { haftalikMenu, gununMenusu };
