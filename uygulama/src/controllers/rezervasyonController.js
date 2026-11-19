const rezervasyonService = require('../services/rezervasyonService');
const istekHatasi = require('../utils/istekHatasi');

async function olustur(req, res) {
  const menuId = Number(req.body?.menu_id);
  if (!Number.isInteger(menuId) || menuId <= 0) {
    throw istekHatasi(400, 'Geçersiz menü.');
  }

  const sonuc = await rezervasyonService.rezervasyonYap(req.oturum.kullaniciId, menuId);
  res.status(201).json(sonuc);
}

module.exports = { olustur };
