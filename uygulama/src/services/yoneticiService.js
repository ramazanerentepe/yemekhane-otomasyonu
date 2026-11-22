const yoneticiRepository = require('../repositories/yoneticiRepository');
const menuRepository = require('../repositories/menuRepository');
const menuOnbellegiRepository = require('../repositories/menuOnbellegiRepository');
const istekHatasi = require('../utils/istekHatasi');

const AYNI_KAYIT = 1062;
const IKINCI_SILME_GECIKMESI = 2000;

function menuyuDonustur(menu, yemekler) {
  return {
    id: menu.menu_id,
    tarih: menu.tarih,
    yemekhane_id: menu.yemekhane_id,
    ogun_id: menu.ogun_id,
    kapasite: menu.kapasite,
    rezerve: menu.rezerve,
    bos_yer: menu.bos_yer,
    doluluk_yuzde: menu.doluluk_yuzde,
    duzenlenebilir: menu.duzenlenebilir === 1,
    ogrenci_fiyati: menu.ogrenci_fiyati,
    personel_fiyati: menu.personel_fiyati,
    ortalama_puan: menu.ortalama_puan,
    oy_sayisi: menu.oy_sayisi,
    yemekler: yemekler
      .filter((yemek) => yemek.menu_id === menu.menu_id)
      .map((yemek) => ({ id: yemek.yemek_id, ad: yemek.yemek })),
  };
}

async function haftalikRapor(yemekhaneId, ogunId, tarih) {
  const { bugun, baslangic, bitis } = await menuRepository.haftaAraligiGetir(tarih);
  const [menuler, yemekler, ozet] = await Promise.all([
    yoneticiRepository.haftalikRapor(yemekhaneId, ogunId, baslangic, bitis),
    yoneticiRepository.haftalikMenuYemekleri(yemekhaneId, ogunId, baslangic, bitis),
    yoneticiRepository.haftalikOzet(yemekhaneId, baslangic, bitis),
  ]);

  return {
    bugun,
    baslangic,
    bitis,
    ozet,
    menuler: menuler.map((menu) => menuyuDonustur(menu, yemekler)),
  };
}

async function yemekKatalogu() {
  const satirlar = await yoneticiRepository.yemekleriGetir();
  const kategoriler = new Map();

  satirlar.forEach((satir) => {
    if (!kategoriler.has(satir.kategori_id)) {
      kategoriler.set(satir.kategori_id, { id: satir.kategori_id, ad: satir.kategori, yemekler: [] });
    }
    kategoriler.get(satir.kategori_id).yemekler.push({
      id: satir.id,
      ad: satir.ad,
      kalori: satir.kalori,
      vejetaryen: satir.vejetaryen === 1,
    });
  });

  return [...kategoriler.values()];
}

async function yemekleriDogrula(baglanti, yemekIdler) {
  const bulunan = await yoneticiRepository.bulunanYemekSayisi(baglanti, yemekIdler);
  if (bulunan !== yemekIdler.length) {
    throw istekHatasi(400, 'Seçilen yemeklerden bazıları bulunamadı.');
  }
}

async function onbellekKaydiniSil(menu, neden) {
  const anahtar = menuOnbellegiRepository.anahtar(menu.yemekhane_id, menu.tarih, menu.ogun_id);
  try {
    const silinen = await menuOnbellegiRepository.sil(menu.yemekhane_id, menu.tarih, menu.ogun_id);
    console.log(`[önbellek] ${anahtar} ${silinen ? 'silindi' : 'önbellekte yoktu'} (${neden})`);
  } catch (hata) {
    console.error(`[önbellek] ${anahtar} silinemedi:`, hata.message);
  }
}

function onbellegiGecersizKil(menu) {
  onbellekKaydiniSil(menu, 'menü kaydedildi');
  setTimeout(() => onbellekKaydiniSil(menu, 'replikasyon gecikmesine karşı ikinci silme'), IKINCI_SILME_GECIKMESI);
}

async function kaydedilenMenu(menuId, mesaj) {
  const { menu, yemekler } = await yoneticiRepository.menuRaporuKaynaktan(menuId);
  onbellegiGecersizKil(menu);
  return { mesaj, menu: menuyuDonustur(menu, yemekler) };
}

async function menuOlustur(veri) {
  let menuId;
  try {
    menuId = await yoneticiRepository.islemIcinde(async (baglanti) => {
      if (!(await yoneticiRepository.yemekhaneVarMi(baglanti, veri.yemekhaneId))) {
        throw istekHatasi(400, 'Yemekhane bulunamadı.');
      }

      const ogun = await yoneticiRepository.ogunZamani(baglanti, veri.ogunId, veri.tarih);
      if (!ogun) {
        throw istekHatasi(400, 'Öğün bulunamadı.');
      }
      if (ogun.acik !== 1) {
        throw istekHatasi(400, 'Rezervasyon süresi geçmiş bir öğüne menü eklenemez.');
      }

      await yemekleriDogrula(baglanti, veri.yemekIdler);
      const yeniId = await yoneticiRepository.menuEkle(baglanti, veri);
      await yoneticiRepository.menuYemekleriniYaz(baglanti, yeniId, veri.yemekIdler);
      return yeniId;
    });
  } catch (hata) {
    if (hata.errno === AYNI_KAYIT) {
      throw istekHatasi(409, 'Bu yemekhanede o gün ve öğün için zaten bir menü var.');
    }
    throw hata;
  }

  return kaydedilenMenu(menuId, 'Menü oluşturuldu.');
}

async function menuGuncelle(menuId, veri) {
  await yoneticiRepository.islemIcinde(async (baglanti) => {
    const menu = await yoneticiRepository.menuyuKilitle(baglanti, menuId);
    if (!menu) {
      throw istekHatasi(404, 'Menü bulunamadı.');
    }
    if (menu.acik !== 1) {
      throw istekHatasi(400, 'Rezervasyon süresi geçmiş bir menü düzenlenemez.');
    }

    await yemekleriDogrula(baglanti, veri.yemekIdler);
    await yoneticiRepository.fiyatlariGuncelle(baglanti, menuId, veri);
    await yoneticiRepository.menuYemekleriniYaz(baglanti, menuId, veri.yemekIdler);
  });

  return kaydedilenMenu(menuId, 'Menü güncellendi.');
}

module.exports = { haftalikRapor, yemekKatalogu, menuOlustur, menuGuncelle };
