import { api } from './api.js';
import { eleman, paraBicimle, puaniYaz, tarihOku, yildizlar } from './yardimcilar.js';

const baslikBicimi = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
const sayiBicimi = new Intl.NumberFormat('tr-TR');

const ISKELET = `
  <dialog class="detay" aria-labelledby="detay-baslik">
    <span class="detay__tutamac" aria-hidden="true"></span>
    <header class="detay__baslik">
      <div>
        <h2 id="detay-baslik" data-detay-tarih></h2>
        <p data-detay-alt></p>
      </div>
      <button type="button" class="detay__kapat" data-detay-kapat aria-label="Kapat">
        <svg class="ikon" aria-hidden="true"><use href="/img/ikonlar.svg#kapat"></use></svg>
      </button>
    </header>

    <div class="detay__govde">
      <ul class="detay__yemekler" data-detay-yemekler></ul>

      <ul class="detay__bilgiler">
        <li class="cip">
          <svg class="ikon" aria-hidden="true"><use href="/img/ikonlar.svg#ates"></use></svg>
          <span data-detay-kalori></span>
        </li>
        <li class="cip" data-detay-vejetaryen>
          <svg class="ikon" aria-hidden="true"><use href="/img/ikonlar.svg#yaprak"></use></svg>
          <span></span>
        </li>
        <li class="cip">
          <svg class="ikon" aria-hidden="true"><use href="/img/ikonlar.svg#saat"></use></svg>
          <span data-detay-servis></span>
        </li>
        <li class="cip">Son rez. <span data-detay-son></span></li>
        <li class="cip" data-detay-bos-yer-kutusu>Boş yer <span data-detay-bos-yer></span></li>
      </ul>

      <div class="detay__eylem">
        <strong class="detay__fiyat" data-detay-fiyat></strong>
        <span class="detay__puan" data-detay-puan></span>
        <button type="button" class="dugme detay__dugme" data-detay-dugme></button>
      </div>
      <p class="detay__uyari" data-detay-uyari role="status"></p>

      <h3 class="detay__alt-baslik">Yorumlar <small data-detay-yorum-sayisi></small></h3>
      <div class="detay__yorumlar" data-detay-yorumlar></div>
    </div>
  </dialog>`;

function yemekSatiri(yemek) {
  const satir = eleman('li', 'detay-yemek');
  const etiketler = eleman('span', 'detay-yemek__etiketler');
  etiketler.append(...yemek.alerjenler.map((alerjen) => eleman('span', 'rozet rozet--alerjen', alerjen)));
  satir.append(
    eleman('span', 'detay-yemek__ad', yemek.ad),
    etiketler,
    eleman('span', 'detay-yemek__kalori', `${yemek.kalori} kcal`)
  );
  return satir;
}

function yorumKutusu(yorum) {
  const kutu = eleman('div', 'yorum');
  const ust = eleman('div', 'yorum__ust');
  ust.append(yildizlar(yorum.puan), eleman('span', 'yorum__kisi', yorum.kullanici));
  kutu.append(ust);
  if (yorum.yorum) kutu.append(eleman('p', 'yorum__metin', yorum.yorum));
  return kutu;
}

export function menuDetayiOlustur() {
  document.body.insertAdjacentHTML('beforeend', ISKELET);
  const pencere = document.body.lastElementChild;
  const bul = (secici) => pencere.querySelector(secici);
  const yaz = (secici, metin) => { bul(secici).textContent = metin; };
  const dugme = bul('[data-detay-dugme]');

  let istekNo = 0;
  let dugmeyeTiklaninca = null;

  function eylemiGoster({ dugme: ayar = null, mesaj = '', mesajTuru = 'hata' } = {}) {
    dugme.hidden = !ayar;
    if (ayar) {
      dugme.textContent = ayar.metin;
      dugme.disabled = !ayar.aktif;
    }
    const uyari = bul('[data-detay-uyari]');
    uyari.textContent = mesaj;
    uyari.classList.toggle('detay__uyari--basari', mesajTuru === 'basari');
    uyari.classList.toggle('detay__uyari--bilgi', mesajTuru === 'bilgi');
  }

  function bosYeriGoster(bosYer) {
    bul('[data-detay-bos-yer-kutusu]').hidden = bosYer === undefined || bosYer === null;
    yaz('[data-detay-bos-yer]', bosYer ?? '');
  }

  function yorumlariGoster(yorumlar, servisEdildi) {
    yaz('[data-detay-yorum-sayisi]', yorumlar.length > 0 ? `(${yorumlar.length})` : '');
    const alan = bul('[data-detay-yorumlar]');
    if (yorumlar.length > 0) {
      alan.replaceChildren(...yorumlar.map(yorumKutusu));
      return;
    }
    const mesaj = servisEdildi
      ? 'Bu menü için henüz yorum yok.'
      : 'Yorumlar menü servis edildikten sonra görünür.';
    alan.replaceChildren(eleman('p', 'detay__yorumlar-bos', mesaj));
  }

  function doldur(secenekler, menu, yorumlar) {
    yaz('[data-detay-tarih]', baslikBicimi.format(tarihOku(secenekler.tarih)));
    yaz('[data-detay-alt]', `${menu.ogun} · ${menu.yemekhane}`);
    bul('[data-detay-yemekler]').replaceChildren(...menu.yemekler.map(yemekSatiri));

    yaz('[data-detay-kalori]', `${sayiBicimi.format(menu.toplam_kalori)} kcal`);
    const vejetaryen = bul('[data-detay-vejetaryen]');
    vejetaryen.classList.toggle('cip--vejetaryen', menu.vejetaryen);
    vejetaryen.querySelector('span').textContent = menu.vejetaryen ? 'Vejetaryen' : 'Vejetaryen değil';
    yaz('[data-detay-servis]', `${menu.servis_baslangic}–${menu.servis_bitis}`);
    yaz('[data-detay-son]', menu.rezervasyon_son);
    bosYeriGoster(secenekler.bosYer);

    yaz('[data-detay-fiyat]', paraBicimle(secenekler.fiyat ?? menu.fiyat));
    puaniYaz(bul('[data-detay-puan]'), secenekler.puan, true);
    eylemiGoster(secenekler.eylem);
    yorumlariGoster(yorumlar, secenekler.tarih < secenekler.bugun);
  }

  async function ac(secenekler) {
    const no = ++istekNo;
    const sorgu = new URLSearchParams({
      yemekhane: secenekler.yemekhaneId,
      tarih: secenekler.tarih,
      ogun: secenekler.ogunId,
    });

    const [menu, yorumlar] = await Promise.all([
      api(`/menu?${sorgu}`),
      api(`/menuler/${secenekler.menuId}/yorumlar`),
    ]);
    if (no !== istekNo) return;

    dugmeyeTiklaninca = secenekler.dugmeyeTiklaninca ?? null;
    doldur(secenekler, menu, yorumlar);
    bul('.detay__govde').scrollTop = 0;
    if (!pencere.open) pencere.showModal();
  }

  function kapat() {
    istekNo += 1;
    pencere.close();
  }

  bul('[data-detay-kapat]').addEventListener('click', kapat);
  dugme.addEventListener('click', () => dugmeyeTiklaninca?.());
  pencere.addEventListener('click', (olay) => {
    if (olay.target !== pencere) return;
    const kutu = pencere.getBoundingClientRect();
    const disarida = olay.clientX < kutu.left || olay.clientX > kutu.right
      || olay.clientY < kutu.top || olay.clientY > kutu.bottom;
    if (disarida) kapat();
  });

  return { ac, kapat, eylemiGoster, bosYeriGoster };
}
