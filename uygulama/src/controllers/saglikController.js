const saglikRepository = require('../repositories/saglikRepository');

function durum(req, res) {
  res.json({ durum: 'ok', servis: 'yemekhane-api' });
}

async function veritabani(req, res) {
  const sonuc = await saglikRepository.veritabaniDurumu();
  res.json(sonuc);
}

module.exports = { durum , veritabani };