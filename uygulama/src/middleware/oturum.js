const oturumService = require('../services/oturumService');
const istekHatasi = require('../utils/istekHatasi');

// "Authorization: Bearer <token>" başlığını kontrol eder
async function oturumGerekli(req, res, next) {
  const baslik = req.get('Authorization') || '';
  const token = baslik.startsWith('Bearer ') ? baslik.slice(7) : null;
  const oturum = token ? await oturumService.getir(token) : null;

  if (!oturum) {
    throw istekHatasi(401, 'Oturum açmanız gerekiyor.');
  }
  req.oturum = { token, ...oturum };
  next();
}

module.exports = { oturumGerekli };