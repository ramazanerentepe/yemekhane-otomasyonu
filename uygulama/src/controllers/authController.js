const authService = require('../services/authService');
const oturumService = require('../services/oturumService');
const kullaniciRepository = require('../repositories/kullaniciRepository');
const istekHatasi = require('../utils/istekHatasi');

async function giris(req, res) {
  const { eposta, sifre } = req.body || {};
  if (!eposta || !sifre) {
    throw istekHatasi(400, 'E-posta ve şifre zorunludur.');
  }
  const sonuc = await authService.girisYap(String(eposta).trim(), String(sifre));
  res.json(sonuc);
}

async function cikis(req, res) {
  await oturumService.sil(req.oturum.token);
  res.json({ mesaj: 'Çıkış yapıldı.' });
}

async function ben(req, res) {
  const kullanici = await kullaniciRepository.idIleBul(req.oturum.kullaniciId);
  res.json(kullanici);
}

module.exports = { giris, cikis, ben };