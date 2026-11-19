import { oturumuBaslat } from '../oturum.js';
import { bildirimGoster, metinYaz } from '../yardimcilar.js';

const sayfaBildirimi = document.querySelector('#sayfa-bildirim');

try {
  const kullanici = await oturumuBaslat();
  if (kullanici) metinYaz('[data-kullanici-ad]', kullanici.ad);
} catch (hata) {
  if (hata.durum !== 401) bildirimGoster(sayfaBildirimi, hata.message);
}
