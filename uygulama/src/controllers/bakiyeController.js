const bakiyeService = require('../services/bakiyeService');
const istekHatasi = require('../utils/istekHatasi');

const TUTAR_BICIMI = /^\d+([.,]\d{1,2})?$/;

async function durum(req, res) {
  res.json(await bakiyeService.bakiyeDurumu(req.oturum.kullaniciId));
}

async function yukle(req, res) {
  const metin = String(req.body?.tutar ?? '').trim();
  if (!TUTAR_BICIMI.test(metin)) {
    throw istekHatasi(400, 'Geçerli bir tutar girin (en fazla 2 ondalık basamak).');
  }

  const tutar = Number(metin.replace(',', '.'));
  res.status(201).json(await bakiyeService.bakiyeYukle(req.oturum.kullaniciId, tutar));
}

module.exports = { durum, yukle };
