const profilService = require('../services/profilService');
const istekHatasi = require('../utils/istekHatasi');
const { pozitifTamSayi } = require('../utils/dogrulama');

const EN_FAZLA_ALERJEN = 20;

async function getir(req, res) {
  res.json(await profilService.profil(req.oturum.kullaniciId));
}

async function alerjenleriKaydet(req, res) {
  const gelen = req.body?.alerjen_idler;
  if (!Array.isArray(gelen) || gelen.length > EN_FAZLA_ALERJEN) {
    throw istekHatasi(400, 'Geçersiz alerjen seçimi.');
  }

  const idler = [...new Set(gelen.map(pozitifTamSayi))];
  if (idler.includes(null)) {
    throw istekHatasi(400, 'Geçersiz alerjen seçimi.');
  }

  res.json(await profilService.alerjenleriKaydet(req.oturum.kullaniciId, idler));
}

module.exports = { getir, alerjenleriKaydet };
