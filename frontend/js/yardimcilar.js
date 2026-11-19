const paraBicimi = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const paraBicimle = (tutar) => `${paraBicimi.format(tutar)} TL`;

export const basHarfler = (ad = '', soyad = '') =>
  `${ad.charAt(0)}${soyad.charAt(0)}`.toLocaleUpperCase('tr-TR');

export function metinYaz(secici, deger) {
  document.querySelectorAll(secici).forEach((eleman) => {
    eleman.textContent = deger;
  });
}

export function bildirimGoster(eleman, mesaj, tur = 'hata') {
  eleman.textContent = mesaj;
  eleman.classList.toggle('bildirim-hata', tur === 'hata');
  eleman.classList.toggle('bildirim-basari', tur === 'basari');
  eleman.hidden = false;
}

export function bildirimGizle(eleman) {
  eleman.hidden = true;
  eleman.textContent = '';
}
