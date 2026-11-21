const menuService = require('../services/menuService');
const menuRepository = require('../repositories/menuRepository');
const istekHatasi = require('../utils/istekHatasi');
const { pozitifTamSayi, gecerliTarih } = require('../utils/dogrulama');

async function yemekhaneler(req, res) {
  res.json(await menuRepository.yemekhaneleriGetir());
}

async function ogunler(req, res) {
  res.json(await menuRepository.ogunleriGetir());
}

async function haftalikMenu(req, res) {
  const yemekhaneId = pozitifTamSayi(req.query.yemekhane);
  const ogunId = pozitifTamSayi(req.query.ogun);
  const tarih = req.query.tarih === undefined ? null : String(req.query.tarih);

  if (!yemekhaneId || !ogunId) {
    throw istekHatasi(400, 'Yemekhane ve öğün seçilmelidir.');
  }
  if (tarih !== null && !gecerliTarih(tarih)) {
    throw istekHatasi(400, 'Geçersiz tarih.');
  }

  res.json(await menuService.haftalikMenu(yemekhaneId, ogunId, tarih, req.oturum));
}

async function gununMenusu(req, res) {
  const yemekhaneId = pozitifTamSayi(req.query.yemekhane);
  const ogunId = pozitifTamSayi(req.query.ogun);
  const tarih = String(req.query.tarih ?? '');

  if (!yemekhaneId || !ogunId || !gecerliTarih(tarih)) {
    throw istekHatasi(400, 'Yemekhane, tarih ve öğün seçilmelidir.');
  }

  res.json(await menuService.gununMenusu(yemekhaneId, tarih, ogunId, req.oturum.rol));
}

async function yorumlar(req, res) {
  const menuId = pozitifTamSayi(req.params.id);
  if (!menuId) {
    throw istekHatasi(400, 'Geçersiz menü.');
  }

  res.json(await menuRepository.yorumlariGetir(menuId));
}

module.exports = { yemekhaneler, ogunler, haftalikMenu, gununMenusu, yorumlar };
