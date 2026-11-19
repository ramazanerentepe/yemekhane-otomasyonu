import { api, token } from './api.js';
import { basHarfler, metinYaz, paraBicimle } from './yardimcilar.js';

const ROL_ADLARI = {
  ogrenci: 'Öğrenci',
  personel: 'Personel',
  yonetici: 'Yönetici',
};

export const rolAdi = (rol) => ROL_ADLARI[rol] ?? rol;

export async function oturumuBaslat() {
  if (!token.al()) {
    window.location.replace('/');
    return null;
  }

  cikisDugmeleriniBagla();

  const kullanici = await api('/ben');
  ustMenuyuDoldur(kullanici);
  return kullanici;
}

function ustMenuyuDoldur(kullanici) {
  metinYaz('[data-bakiye]', paraBicimle(kullanici.bakiye));

  document.querySelectorAll('[data-avatar]').forEach((eleman) => {
    eleman.textContent = basHarfler(kullanici.ad, kullanici.soyad);
    eleman.title = `${kullanici.ad} ${kullanici.soyad}`;
  });
}

function cikisDugmeleriniBagla() {
  document.querySelectorAll('[data-cikis]').forEach((dugme) => {
    dugme.addEventListener('click', cikisYap);
  });
}

async function cikisYap() {
  await api('/cikis', { method: 'POST' }).catch(() => {});
  token.sil();
  window.location.replace('/');
}
