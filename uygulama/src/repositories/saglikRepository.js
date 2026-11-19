const { yazmaHavuzu, okumaHavuzu } = require('../config/db');

async function sunucuBilgisi(havuz) {
  const [satirlar] = await havuz.query(
    'SELECT @@server_id AS server_id, @@read_only AS salt_okunur'
  );
  return satirlar[0];
}

async function veritabaniDurumu() {
  const [yazma, okuma] = await Promise.all([
    sunucuBilgisi(yazmaHavuzu),
    sunucuBilgisi(okumaHavuzu),
  ]);
  return { yazma, okuma };
}

module.exports = { veritabaniDurumu };