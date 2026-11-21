import { api } from './api.js';
import {
  bildirimGizle,
  bildirimGoster,
  eleman,
  paraBicimle,
  puaniYaz,
  tarihOku,
  yildizlar,
} from './yardimcilar.js';

const baslikBicimi = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
const sayiBicimi = new Intl.NumberFormat('tr-TR');
const YORUM_SINIRI = 500;

const YILDIZ_DUGMELERI = Array.from({ length: 5 }, (_, sira) =>
  `<button type="button" class="yildiz-secici__yildiz" role="radio" aria-checked="false" aria-label="${sira + 1} yıldız" data-puan="${sira + 1}">★</button>`
).join('');

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

      <section class="degerlendirme" data-degerlendirme hidden>
        <div class="degerlendirme__ozet" data-degerlendirme-ozet>
          <div class="degerlendirme__mevcut">
            <strong class="degerlendirme__baslik" data-degerlendirme-baslik></strong>
            <span data-degerlendirme-yildiz></span>
            <p class="degerlendirme__yorum" data-degerlendirme-yorum></p>
          </div>
          <button type="button" class="dugme dugme--ikincil" data-degerlendirme-ac></button>
        </div>

        <form class="degerlendirme__form" data-degerlendirme-form hidden novalidate>
          <span class="degerlendirme__etiket" id="degerlendirme-puan-etiketi">Puanın</span>
          <div class="yildiz-secici" role="radiogroup" aria-labelledby="degerlendirme-puan-etiketi" data-yildiz-secici>
            ${YILDIZ_DUGMELERI}
          </div>
          <label class="degerlendirme__etiket" for="degerlendirme-yorum">Yorumun <small>(isteğe bağlı)</small></label>
          <textarea id="degerlendirme-yorum" maxlength="${YORUM_SINIRI}" rows="3" placeholder="Yemek nasıldı?"></textarea>
          <div class="degerlendirme__alt">
            <span class="degerlendirme__sayac" data-yorum-sayac></span>
            <div class="degerlendirme__eylemler">
              <button type="button" class="dugme dugme--ikincil" data-degerlendirme-vazgec>Vazgeç</button>
              <button type="submit" class="dugme" data-degerlendirme-gonder>Gönder</button>
            </div>
          </div>
          <p class="bildirim" data-degerlendirme-bildirim role="alert" hidden></p>
        </form>
      </section>

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
  let degerlendirme = null;
  let seciliPuan = 0;

  const dgr = {
    alan: bul('[data-degerlendirme]'),
    ozet: bul('[data-degerlendirme-ozet]'),
    acDugmesi: bul('[data-degerlendirme-ac]'),
    form: bul('[data-degerlendirme-form]'),
    yildizlar: [...pencere.querySelectorAll('[data-puan]')],
    yorum: bul('#degerlendirme-yorum'),
    sayac: bul('[data-yorum-sayac]'),
    gonder: bul('[data-degerlendirme-gonder]'),
    bildirim: bul('[data-degerlendirme-bildirim]'),
  };

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

  function yildizlariBoya(puan) {
    dgr.yildizlar.forEach((yildiz) => {
      const deger = Number(yildiz.dataset.puan);
      yildiz.classList.toggle('yildiz-secici__yildiz--dolu', deger <= puan);
      yildiz.setAttribute('aria-checked', String(deger === seciliPuan));
    });
  }

  function sayaciGoster() {
    dgr.sayac.textContent = `${dgr.yorum.value.length} / ${YORUM_SINIRI}`;
  }

  function degerlendirmeOzetiGoster() {
    const { mevcut } = degerlendirme;
    dgr.form.hidden = true;
    dgr.ozet.hidden = false;
    bul('[data-degerlendirme-yildiz]').replaceChildren(...(mevcut ? [yildizlar(mevcut.puan)] : []));
    yaz('[data-degerlendirme-baslik]', mevcut ? 'Değerlendirmen' : 'Bu menüyü henüz değerlendirmedin.');
    yaz('[data-degerlendirme-yorum]', mevcut?.yorum ?? '');
    dgr.acDugmesi.textContent = mevcut ? 'Düzenle' : 'Değerlendir';
  }

  function degerlendirmeFormunuAc() {
    const { mevcut } = degerlendirme;
    seciliPuan = mevcut?.puan ?? 0;
    dgr.yorum.value = mevcut?.yorum ?? '';
    dgr.gonder.textContent = mevcut ? 'Güncelle' : 'Gönder';
    bildirimGizle(dgr.bildirim);
    yildizlariBoya(seciliPuan);
    sayaciGoster();
    dgr.ozet.hidden = true;
    dgr.form.hidden = false;
    dgr.yildizlar[Math.max(seciliPuan - 1, 0)].focus();
  }

  async function degerlendirmeyiGonder(olay) {
    olay.preventDefault();
    if (!seciliPuan) {
      bildirimGoster(dgr.bildirim, 'Lütfen 1 ile 5 arasında bir puan seç.');
      return;
    }

    dgr.gonder.disabled = true;
    try {
      const sonuc = await degerlendirme.kaydet({ puan: seciliPuan, yorum: dgr.yorum.value.trim() });
      degerlendirme.mevcut = sonuc.degerlendirme;
      puaniYaz(bul('[data-detay-puan]'), sonuc, true);
      yorumlariGoster(sonuc.yorumlar, true);
      degerlendirmeOzetiGoster();
      eylemiGoster({ mesaj: sonuc.mesaj, mesajTuru: 'basari' });
    } catch (hata) {
      bildirimGoster(dgr.bildirim, hata.message);
    } finally {
      dgr.gonder.disabled = false;
    }
  }

  function degerlendirmeAlaniniKur(ayar) {
    degerlendirme = ayar ?? null;
    dgr.alan.hidden = !degerlendirme;
    if (degerlendirme) degerlendirmeOzetiGoster();
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
    degerlendirmeAlaniniKur(secenekler.degerlendirme);
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

  dgr.acDugmesi.addEventListener('click', degerlendirmeFormunuAc);
  bul('[data-degerlendirme-vazgec]').addEventListener('click', degerlendirmeOzetiGoster);
  dgr.form.addEventListener('submit', degerlendirmeyiGonder);
  dgr.yorum.addEventListener('input', sayaciGoster);
  dgr.yildizlar.forEach((yildiz) => {
    const deger = Number(yildiz.dataset.puan);
    yildiz.addEventListener('click', () => {
      seciliPuan = deger;
      yildizlariBoya(seciliPuan);
      bildirimGizle(dgr.bildirim);
    });
    yildiz.addEventListener('mouseenter', () => yildizlariBoya(deger));
  });
  bul('[data-yildiz-secici]').addEventListener('mouseleave', () => yildizlariBoya(seciliPuan));

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
