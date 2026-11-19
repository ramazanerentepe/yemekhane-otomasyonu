const { yazmaHavuzu } = require('../config/db');

async function rezervasyonYap(kullaniciId, menuId) {
  const [sonuclar] = await yazmaHavuzu.query('CALL sp_rezervasyon_yap(?, ?)', [kullaniciId, menuId]);
  return sonuclar[0][0];
}

module.exports = { rezervasyonYap };
