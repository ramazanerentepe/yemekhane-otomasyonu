const rezervasyonService = require('../services/rezervasyonService');
const istekHatasi = require('../utils/istekHatasi');

function pozitifTamSayi(deger) {
  const sayi = Number(deger);
  return Number.isInteger(sayi) && sayi > 0 ? sayi : null;
}

async function listele(req, res) {
  res.json(await rezervasyonService.rezervasyonlarim(req.oturum.kullaniciId));
}

async function olustur(req, res) {
  const menuId = pozitifTamSayi(req.body?.menu_id);
  if (!menuId) {
    throw istekHatasi(400, 'Geçersiz menü.');
  }

  const sonuc = await rezervasyonService.rezervasyonYap(req.oturum.kullaniciId, menuId);
  res.status(201).json(sonuc);
}

async function iptal(req, res) {
  const rezervasyonId = pozitifTamSayi(req.params.id);
  if (!rezervasyonId) {
    throw istekHatasi(400, 'Geçersiz rezervasyon.');
  }

  res.json(await rezervasyonService.rezervasyonIptal(req.oturum.kullaniciId, rezervasyonId));
}

module.exports = { listele, olustur, iptal };
