import { api, token } from '../api.js';
import { bildirimGizle, bildirimGoster } from '../yardimcilar.js';

if (token.al()) {
  window.location.replace('/menu.html');
}

const form = document.querySelector('#giris-formu');
const bildirim = document.querySelector('#giris-bildirim');
const gonderDugmesi = form.querySelector('[type="submit"]');
const sifreAlani = form.querySelector('#sifre');
const sifreDugmesi = form.querySelector('.sifre-goster');

sifreDugmesi.addEventListener('click', () => {
  const gosteriliyor = sifreAlani.type === 'text';
  sifreAlani.type = gosteriliyor ? 'password' : 'text';
  sifreDugmesi.setAttribute('aria-pressed', String(!gosteriliyor));
  sifreDugmesi.setAttribute('aria-label', gosteriliyor ? 'Şifreyi göster' : 'Şifreyi gizle');
});

form.addEventListener('input', () => bildirimGizle(bildirim));

form.addEventListener('submit', async (olay) => {
  olay.preventDefault();
  bildirimGizle(bildirim);
  gonderDugmesi.disabled = true;

  try {
    const sonuc = await api('/giris', {
      method: 'POST',
      govde: { eposta: form.eposta.value, sifre: form.sifre.value },
    });
    token.kaydet(sonuc.token);
    window.location.replace('/menu.html');
  } catch (hata) {
    bildirimGoster(bildirim, hata.message);
    gonderDugmesi.disabled = false;
  }
});
