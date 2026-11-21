const degerlendirmeService = require('../services/degerlendirmeService');
const istekHatasi = require('../utils/istekHatasi');

const YORUM_SINIRI = 500;

async function degerlendir(req, res) {
  const menuId = Number(req.body?.menu_id);
  const puan = Number(req.body?.puan);
  const yorum = String(req.body?.yorum ?? '').trim();

  if (!Number.isInteger(menuId) || menuId <= 0) {
    throw istekHatasi(400, 'Geçersiz menü.');
  }
  if (!Number.isInteger(puan) || puan < 1 || puan > 5) {
    throw istekHatasi(400, 'Puan 1 ile 5 arasında olmalıdır.');
  }
  if (yorum.length > YORUM_SINIRI) {
    throw istekHatasi(400, `Yorum en fazla ${YORUM_SINIRI} karakter olabilir.`);
  }

  const sonuc = await degerlendirmeService.degerlendir(
    req.oturum.kullaniciId,
    menuId,
    puan,
    yorum === '' ? null : yorum
  );
  res.status(sonuc.islem === 'eklendi' ? 201 : 200).json(sonuc);
}

module.exports = { degerlendir };
