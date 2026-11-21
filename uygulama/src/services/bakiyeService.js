const bakiyeRepository = require('../repositories/bakiyeRepository');

function ozetle(toplamlar) {
  const toplam = (tur) => Math.abs(toplamlar.find((satir) => satir.tur === tur)?.toplam ?? 0);
  return {
    yukleme: toplam('yukleme'),
    harcama: toplam('rezervasyon'),
    iade: toplam('iade'),
  };
}

function hareketiDonustur(satir) {
  return {
    id: satir.id,
    tur: satir.tur,
    tutar: satir.tutar,
    aciklama: satir.aciklama,
    zaman: satir.zaman,
    menu: satir.menu_tarihi
      ? { tarih: satir.menu_tarihi, ogun: satir.ogun, yemekhane: satir.yemekhane }
      : null,
  };
}

async function bakiyeDurumu(kullaniciId) {
  const [bakiye, toplamlar, hareketler] = await Promise.all([
    bakiyeRepository.bakiyeGetir(kullaniciId),
    bakiyeRepository.hareketToplamlari(kullaniciId),
    bakiyeRepository.hareketleriGetir(kullaniciId),
  ]);

  return {
    bakiye,
    ozet: ozetle(toplamlar),
    hareketler: hareketler.map(hareketiDonustur),
  };
}

async function bakiyeYukle(kullaniciId, tutar) {
  const sonuc = await bakiyeRepository.bakiyeYukle(kullaniciId, tutar);
  return {
    hareket_id: sonuc.hareket_id,
    tutar,
    bakiye: sonuc.bakiye,
    mesaj: 'Bakiye yüklendi.',
  };
}

module.exports = { bakiyeDurumu, bakiyeYukle };
