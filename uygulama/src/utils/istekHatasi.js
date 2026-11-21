// Kullanıcıya gösterilecek, HTTP durum kodu belli hatalar üretir
function istekHatasi(durumKodu, mesaj) {
  const hata = new Error(mesaj);
  hata.status = durumKodu;
  return hata;
}

module.exports = istekHatasi;