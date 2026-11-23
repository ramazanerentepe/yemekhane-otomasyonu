const rezervasyonService = require('../services/rezervasyonService');
const istekHatasi = require('../utils/istekHatasi');
const { pozitifTamSayi } = require('../utils/dogrulama');

const PORSIYONLAR = ['tam', 'yarim'];

async function listele(req, res) {
  res.json(await rezervasyonService.rezervasyonlarim(req.oturum.kullaniciId));
}

async function olustur(req, res) {
  const menuId = pozitifTamSayi(req.body?.menu_id);
  const porsiyon = req.body?.porsiyon ?? 'tam';
  if (!menuId) {
    throw istekHatasi(400, 'Geçersiz menü.');
  }
  if (!PORSIYONLAR.includes(porsiyon)) {
    throw istekHatasi(400, 'Geçersiz porsiyon.');
  }

  const sonuc = await rezervasyonService.rezervasyonYap(req.oturum.kullaniciId, menuId, porsiyon);
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
