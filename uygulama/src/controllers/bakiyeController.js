const bakiyeService = require('../services/bakiyeService');
const istekHatasi = require('../utils/istekHatasi');
const { tutarOku } = require('../utils/dogrulama');

async function durum(req, res) {
  res.json(await bakiyeService.bakiyeDurumu(req.oturum.kullaniciId));
}

async function yukle(req, res) {
  const tutar = tutarOku(req.body?.tutar);
  if (tutar === null) {
    throw istekHatasi(400, 'Geçerli bir tutar girin (en fazla 2 ondalık basamak).');
  }

  res.status(201).json(await bakiyeService.bakiyeYukle(req.oturum.kullaniciId, tutar));
}

module.exports = { durum, yukle };
