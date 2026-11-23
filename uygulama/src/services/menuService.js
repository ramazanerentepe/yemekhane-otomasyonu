const menuRepository = require('../repositories/menuRepository');
const menuOnbellegiRepository = require('../repositories/menuOnbellegiRepository');
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

async function haftalikMenu(yemekhaneId, ogunId, tarih, { kullaniciId, rol }) {
  const { bugun, baslangic, bitis } = await menuRepository.haftaAraligiGetir(tarih);
  const [menuler, yemekler] = await Promise.all([
    menuRepository.haftalikMenuleriGetir(kullaniciId, yemekhaneId, ogunId, baslangic, bitis),
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
      rezerve_edildi: menu.rezervasyon_id !== null,
      rezervasyon_id: menu.rezervasyon_id,
      rezervasyon_durumu: menu.rezervasyon_durumu,
      degerlendirme: menu.benim_puanim === null
        ? null
        : { puan: menu.benim_puanim, yorum: menu.benim_yorumum },
      ortalama_puan: menu.ortalama_puan,
      oy_sayisi: menu.oy_sayisi,
      yemekler: yemekler.filter((y) => y.menu_id === menu.menu_id).map((y) => y.yemek),
    })),
  };
}

async function onbellektenOku(yemekhaneId, tarih, ogunId) {
  try {
    return await menuOnbellegiRepository.getir(yemekhaneId, tarih, ogunId);
  } catch (hata) {
    console.error('[önbellek] okunamadı:', hata.message);
    return null;
  }
}

async function onbellegeYaz(yemekhaneId, tarih, ogunId, satirlar) {
  try {
    return await menuOnbellegiRepository.yaz(yemekhaneId, tarih, ogunId, satirlar);
  } catch (hata) {
    console.error('[önbellek] yazılamadı:', hata.message);
    return null;
  }
}

async function menuSatirlari(yemekhaneId, tarih, ogunId) {
  const anahtar = menuOnbellegiRepository.anahtar(yemekhaneId, tarih, ogunId);
  const onbellekteki = await onbellektenOku(yemekhaneId, tarih, ogunId);
  if (onbellekteki) {
    console.log(`[önbellek] ${anahtar} Redis'ten okundu`);
    return onbellekteki;
  }

  const satirlar = await menuRepository.gununMenusunuGetir(yemekhaneId, tarih, ogunId);
  if (satirlar.length > 0) {
    const sure = await onbellegeYaz(yemekhaneId, tarih, ogunId, satirlar);
    const sonuc = sure > 0
      ? `, Redis'e yazıldı (TTL ${sure} sn)`
      : sure === 0 ? ' (geçmiş gün, önbelleğe yazılmadı)' : '';
    console.log(`[önbellek] ${anahtar} veritabanından okundu${sonuc}`);
  }
  return satirlar;
}

async function gununMenusu(yemekhaneId, tarih, ogunId, rol) {
  const satirlar = await menuSatirlari(yemekhaneId, tarih, ogunId);
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
