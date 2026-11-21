const paraBicimi = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const puanBicimi = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const paraBicimle = (tutar) => `${paraBicimi.format(tutar)} TL`;

export const basHarfler = (ad = '', soyad = '') =>
  `${ad.charAt(0)}${soyad.charAt(0)}`.toLocaleUpperCase('tr-TR');

const ikiHane = (sayi) => String(sayi).padStart(2, '0');

export const isoTarih = (tarih) =>
  `${tarih.getFullYear()}-${ikiHane(tarih.getMonth() + 1)}-${ikiHane(tarih.getDate())}`;

export function tarihOku(metin) {
  const [yil, ay, gun] = metin.split('-').map(Number);
  return new Date(yil, ay - 1, gun);
}

export function gunEkle(tarih, gun) {
  return new Date(tarih.getFullYear(), tarih.getMonth(), tarih.getDate() + gun);
}

export const simdikiSaat = () => {
  const simdi = new Date();
  return `${ikiHane(simdi.getHours())}:${ikiHane(simdi.getMinutes())}`;
};

export function eleman(etiket, sinif, metin) {
  const yeni = document.createElement(etiket);
  if (sinif) yeni.className = sinif;
  if (metin !== undefined) yeni.textContent = metin;
  return yeni;
}

export function yildizlar(puan) {
  const dolu = Math.round(puan);
  const kutu = eleman('span', 'yildizlar', '★'.repeat(dolu));
  kutu.setAttribute('role', 'img');
  kutu.setAttribute('aria-label', `5 üzerinden ${puanBicimi.format(puan)} puan`);
  kutu.append(eleman('span', 'yildizlar__bos', '★'.repeat(5 - dolu)));
  return kutu;
}

export function puaniYaz(hedef, { ortalama_puan: ortalama, oy_sayisi: oySayisi }, oySayisiGoster) {
  if (ortalama === null || ortalama === undefined) {
    hedef.textContent = 'Henüz puan yok';
    return;
  }
  hedef.replaceChildren(yildizlar(ortalama), ` ${puanBicimi.format(ortalama)}`);
  if (oySayisiGoster) hedef.append(' ', eleman('small', '', `(${oySayisi} oy)`));
}

export function metinYaz(secici, deger) {
  document.querySelectorAll(secici).forEach((hedef) => {
    hedef.textContent = deger;
  });
}

export function bildirimGoster(hedef, mesaj, tur = 'hata') {
  hedef.textContent = mesaj;
  hedef.classList.toggle('bildirim-hata', tur === 'hata');
  hedef.classList.toggle('bildirim-basari', tur === 'basari');
  hedef.hidden = false;
}

export function bildirimGizle(hedef) {
  hedef.hidden = true;
  hedef.textContent = '';
}
