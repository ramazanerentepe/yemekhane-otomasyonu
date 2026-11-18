function durum(req, res) {
  res.json({ durum: 'ok', servis: 'yemekhane-api' });
}

module.exports = { durum };