const rezervasyonRepository = require('../repositories/rezervasyonRepository');

async function rezervasyonlarim(kullaniciId) {
  const satirlar = await rezervasyonRepository.kullanicininRezervasyonlari(kullaniciId);
  return satirlar.map((satir) => ({
    id: satir.id,
    durum: satir.durum,
    ucret: satir.ucret,
    menu_id: satir.menu_id,
    tarih: satir.tarih,
    yemekhane_id: satir.yemekhane_id,
    ogun_id: satir.ogun_id,
    ogun: satir.ogun,
    yemekhane: satir.yemekhane,
    ortalama_puan: satir.ortalama_puan,
    oy_sayisi: satir.oy_sayisi,
    servis_baslangic: satir.servis_baslangic,
    servis_bitis: satir.servis_bitis,
    iptal_son_saat: satir.iptal_son_saat,
    iptal_edilebilir: satir.iptal_edilebilir === 1,
    servis_gecti: satir.servis_gecti === 1,
    yemekler: satir.yemekler ?? '',
  }));
}

async function rezervasyonYap(kullaniciId, menuId) {
  const sonuc = await rezervasyonRepository.rezervasyonYap(kullaniciId, menuId);
  return {
    rezervasyon_id: sonuc.rezervasyon_id,
    ucret: sonuc.ucret,
    bakiye: sonuc.bakiye,
    mesaj: 'Rezervasyon oluşturuldu.',
  };
}

async function rezervasyonIptal(kullaniciId, rezervasyonId) {
  const sonuc = await rezervasyonRepository.rezervasyonIptal(kullaniciId, rezervasyonId);
  return {
    rezervasyon_id: sonuc.rezervasyon_id,
    iade: sonuc.iade,
    bakiye: sonuc.bakiye,
    mesaj: 'Rezervasyon iptal edildi.',
  };
}

module.exports = { rezervasyonlarim, rezervasyonYap, rezervasyonIptal };
