// Hiçbir route eşleşmezse: Express'in HTML sayfası yerine JSON
function bulunamadi(req, res) {
  res.status(404).json({ hata: 'İstenen kaynak bulunamadı.' });
}

// Tüm hatalar buraya düşer
function hataYakalayici(err, req, res, next) {
  if (err.errno === 1644) {
    return res.status(400).json({ hata: err.sqlMessage });
  }

  // Bozuk JSON gövdesi
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ hata: 'Geçersiz istek gövdesi.' });
  }

  // Geri kalan her şey sadece günlüğe
  console.error('[hata]', err);
  res.status(500).json({ hata: 'Beklenmeyen bir hata oluştu.' });
}

module.exports = { bulunamadi, hataYakalayici };