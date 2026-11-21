const bcrypt = require('bcryptjs');
const kullaniciRepository = require('../repositories/kullaniciRepository');
const oturumService = require('./oturumService');
const istekHatasi = require('../utils/istekHatasi');

async function girisYap(eposta, sifre) {
  const kullanici = await kullaniciRepository.epostaIleBul(eposta);

  if (!kullanici || !kullanici.aktif) {
    throw istekHatasi(401, 'E-posta veya şifre hatalı.');
  }
  const sifreDogru = await bcrypt.compare(sifre, kullanici.sifre_hash);
  if (!sifreDogru) {
    throw istekHatasi(401, 'E-posta veya şifre hatalı.');
  }

  const token = await oturumService.olustur(kullanici);
  return {
    token,
    kullanici: { id: kullanici.id, ad: kullanici.ad, soyad: kullanici.soyad, rol: kullanici.rol },
  };
}

module.exports = { girisYap };