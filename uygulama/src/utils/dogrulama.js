const TARIH_BICIMI = /^\d{4}-\d{2}-\d{2}$/;
const TUTAR_BICIMI = /^\d+([.,]\d{1,2})?$/;

function pozitifTamSayi(deger) {
  const sayi = Number(deger);
  return Number.isInteger(sayi) && sayi > 0 ? sayi : null;
}

function gecerliTarih(deger) {
  if (!TARIH_BICIMI.test(deger)) return false;
  const tarih = new Date(`${deger}T00:00:00Z`);
  return !Number.isNaN(tarih.getTime()) && tarih.toISOString().startsWith(deger);
}

function tutarOku(deger) {
  const metin = String(deger ?? '').trim();
  return TUTAR_BICIMI.test(metin) ? Number(metin.replace(',', '.')) : null;
}

module.exports = { pozitifTamSayi, gecerliTarih, tutarOku };
