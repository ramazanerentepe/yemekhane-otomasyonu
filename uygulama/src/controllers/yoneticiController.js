const yoneticiService = require('../services/yoneticiService');
const istekHatasi = require('../utils/istekHatasi');
const { pozitifTamSayi, gecerliTarih, tutarOku } = require('../utils/dogrulama');

const EN_YUKSEK_FIYAT = 1000;
const EN_FAZLA_YEMEK = 12;

function fiyatOku(deger) {
  const fiyat = tutarOku(deger);
  if (fiyat === null || fiyat <= 0 || fiyat > EN_YUKSEK_FIYAT) {
    throw istekHatasi(400, `Fiyatlar 0 ile ${EN_YUKSEK_FIYAT} TL arasında ve en fazla 2 ondalık basamaklı olmalıdır.`);
  }
  return fiyat;
}

function yemekleriOku(deger) {
  if (!Array.isArray(deger) || deger.length === 0) {
    throw istekHatasi(400, 'En az bir yemek seçmelisin.');
  }

  const idler = [...new Set(deger.map(pozitifTamSayi))];
  if (idler.includes(null)) {
    throw istekHatasi(400, 'Geçersiz yemek seçimi.');
  }
  if (idler.length > EN_FAZLA_YEMEK) {
    throw istekHatasi(400, `Bir menüde en fazla ${EN_FAZLA_YEMEK} yemek olabilir.`);
  }
  return idler;
}

function menuIcerigiOku(govde) {
  return {
    ogrenciFiyati: fiyatOku(govde?.ogrenci_fiyati),
    personelFiyati: fiyatOku(govde?.personel_fiyati),
    yemekIdler: yemekleriOku(govde?.yemek_idler),
  };
}

async function rapor(req, res) {
  const yemekhaneId = pozitifTamSayi(req.query.yemekhane);
  const ogunId = pozitifTamSayi(req.query.ogun);
  const tarih = req.query.tarih === undefined ? null : String(req.query.tarih);

  if (!yemekhaneId || !ogunId) {
    throw istekHatasi(400, 'Yemekhane ve öğün seçilmelidir.');
  }
  if (tarih !== null && !gecerliTarih(tarih)) {
    throw istekHatasi(400, 'Geçersiz tarih.');
  }

  res.json(await yoneticiService.haftalikRapor(yemekhaneId, ogunId, tarih));
}

async function yemekler(req, res) {
  res.json(await yoneticiService.yemekKatalogu());
}

async function menuOlustur(req, res) {
  const yemekhaneId = pozitifTamSayi(req.body?.yemekhane_id);
  const ogunId = pozitifTamSayi(req.body?.ogun_id);
  const tarih = String(req.body?.tarih ?? '');

  if (!yemekhaneId || !ogunId) {
    throw istekHatasi(400, 'Yemekhane ve öğün seçilmelidir.');
  }
  if (!gecerliTarih(tarih)) {
    throw istekHatasi(400, 'Geçerli bir tarih seçmelisin.');
  }

  const sonuc = await yoneticiService.menuOlustur({
    yemekhaneId,
    ogunId,
    tarih,
    ...menuIcerigiOku(req.body),
  });
  res.status(201).json(sonuc);
}

async function menuGuncelle(req, res) {
  const menuId = pozitifTamSayi(req.params.id);
  if (!menuId) {
    throw istekHatasi(400, 'Geçersiz menü.');
  }

  res.json(await yoneticiService.menuGuncelle(menuId, menuIcerigiOku(req.body)));
}

module.exports = { rapor, yemekler, menuOlustur, menuGuncelle };
