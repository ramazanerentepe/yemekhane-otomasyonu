const rezervasyonRepository = require('../repositories/rezervasyonRepository');

async function rezervasyonYap(kullaniciId, menuId) {
  const sonuc = await rezervasyonRepository.rezervasyonYap(kullaniciId, menuId);
  return {
    rezervasyon_id: sonuc.rezervasyon_id,
    ucret: sonuc.ucret,
    bakiye: sonuc.bakiye,
    mesaj: 'Rezervasyon oluşturuldu.',
  };
}

module.exports = { rezervasyonYap };
