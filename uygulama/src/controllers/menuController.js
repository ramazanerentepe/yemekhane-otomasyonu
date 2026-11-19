const menuService = require('../services/menuService');
const menuRepository = require('../repositories/menuRepository');
const istekHatasi = require('../utils/istekHatasi');

const TARIH_BICIMI = /^\d{4}-\d{2}-\d{2}$/;

function pozitifTamSayi(deger) {
  const sayi = Number(deger);
  return Number.isInteger(sayi) && sayi > 0 ? sayi : null;
}

function gecerliTarih(deger) {
  if (!TARIH_BICIMI.test(deger)) return false;
  const tarih = new Date(`${deger}T00:00:00Z`);
  return !Number.isNaN(tarih.getTime()) && tarih.toISOString().startsWith(deger);
}

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
