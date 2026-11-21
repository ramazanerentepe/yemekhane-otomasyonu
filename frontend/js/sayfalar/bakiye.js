import { api } from '../api.js';
import { bakiyeyiGoster, oturumuBaslat } from '../oturum.js';
import {
  bildirimGizle,
  bildirimGoster,
  isoTarih,
  metinYaz,
  paraBicimle,
  simdikiSaat,
  tarihOku,
} from '../yardimcilar.js';

const HAREKET_TURLERI = {
  yukleme: { baslik: 'Bakiye yükleme', simge: 'arti', arti: true },
  rezervasyon: { baslik: 'Rezervasyon', simge: 'bilet', arti: false },
  iade: { baslik: 'Rezervasyon iptali (iade)', simge: 'geri', arti: true },
};

const durum = { bakiye: 0, ozet: null, hareketler: [], filtre: 'tumu', yeniHareket: null };

const ogeler = {
  bildirim: document.querySelector('#sayfa-bildirim'),
  form: document.querySelector('[data-yukleme-formu]'),
  tutar: document.querySelector('#tutar'),
  hizliTutarlar: document.querySelectorAll('[data-hizli-tutar]'),
  yukleBildirim: document.querySelector('[data-yukleme-bildirim]'),
  yukleDugmesi: document.querySelector('[data-yukle]'),
  filtreler: document.querySelector('[data-filtreler]'),
  liste: document.querySelector('[data-hareketler]'),
  bos: document.querySelector('[data-bos]'),
  sablon: document.querySelector('#hareket-sablonu'),
};

const bicim = {
  menu: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }),
  zaman: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }),
};

function zamanMetni(zaman) {
  const [tarih, saat] = zaman.split(' ');
  return `${bicim.zaman.format(tarihOku(tarih))} ${saat}`;
}

function ozetiGoster() {
  metinYaz('[data-bakiye-buyuk]', paraBicimle(durum.bakiye));
  metinYaz('[data-ozet-yukleme]', paraBicimle(durum.ozet.yukleme));
  metinYaz('[data-ozet-harcama]', paraBicimle(durum.ozet.harcama));
  metinYaz('[data-ozet-iade]', paraBicimle(durum.ozet.iade));
}

function hareketSatiri(hareket) {
  const satir = ogeler.sablon.content.firstElementChild.cloneNode(true);
  const tur = HAREKET_TURLERI[hareket.tur];

  satir.classList.add(`hareket--${hareket.tur}`);
  if (hareket.id === durum.yeniHareket) satir.classList.add('hareket--yeni');

  satir.querySelector('[data-simge]').setAttribute('href', `/img/ikonlar.svg#${tur.simge}`);
  satir.querySelector('[data-baslik]').textContent = tur.baslik;
  satir.querySelector('[data-detay]').textContent = hareket.menu
    ? `${bicim.menu.format(tarihOku(hareket.menu.tarih))} · ${hareket.menu.ogun} · ${hareket.menu.yemekhane}`
    : '';

  const tutar = satir.querySelector('[data-tutar]');
  tutar.textContent = `${tur.arti ? '+' : '−'}${paraBicimle(Math.abs(hareket.tutar))}`;
  tutar.classList.toggle('hareket__tutar--arti', tur.arti);
  satir.querySelector('[data-zaman]').textContent = zamanMetni(hareket.zaman);

  return satir;
}

function hareketleriGoster() {
  ogeler.filtreler.querySelectorAll('[data-filtre]').forEach((dugme) => {
    dugme.setAttribute('aria-pressed', String(dugme.dataset.filtre === durum.filtre));
  });

  const gorunenler = durum.filtre === 'tumu'
    ? durum.hareketler
    : durum.hareketler.filter((hareket) => hareket.tur === durum.filtre);

  ogeler.liste.replaceChildren(...gorunenler.map(hareketSatiri));
  ogeler.bos.hidden = gorunenler.length > 0;
}

function hizliTutarlariGoster() {
  ogeler.hizliTutarlar.forEach((dugme) => {
    dugme.setAttribute('aria-pressed', String(dugme.dataset.hizliTutar === ogeler.tutar.value.trim()));
  });
}

async function bakiyeYukle(olay) {
  olay.preventDefault();
  bildirimGizle(ogeler.yukleBildirim);
  ogeler.yukleDugmesi.disabled = true;

  try {
    const sonuc = await api('/bakiye/yukle', { method: 'POST', govde: { tutar: ogeler.tutar.value.trim() } });

    durum.bakiye = sonuc.bakiye;
    durum.ozet.yukleme += sonuc.tutar;
    durum.yeniHareket = sonuc.hareket_id;
    durum.hareketler.unshift({
      id: sonuc.hareket_id,
      tur: 'yukleme',
      tutar: sonuc.tutar,
      zaman: `${isoTarih(new Date())} ${simdikiSaat()}`,
      menu: null,
    });

    bakiyeyiGoster(sonuc.bakiye);
    ozetiGoster();
    if (durum.filtre !== 'tumu' && durum.filtre !== 'yukleme') durum.filtre = 'tumu';
    hareketleriGoster();
    durum.yeniHareket = null;

    ogeler.form.reset();
    hizliTutarlariGoster();
    bildirimGoster(
      ogeler.yukleBildirim,
      `${sonuc.mesaj} ${paraBicimle(sonuc.tutar)} eklendi. Yeni bakiye: ${paraBicimle(sonuc.bakiye)}`,
      'basari'
    );
  } catch (hata) {
    bildirimGoster(ogeler.yukleBildirim, hata.message);
    ogeler.tutar.focus();
  } finally {
    ogeler.yukleDugmesi.disabled = false;
  }
}

ogeler.hizliTutarlar.forEach((dugme) => {
  dugme.addEventListener('click', () => {
    ogeler.tutar.value = dugme.dataset.hizliTutar;
    hizliTutarlariGoster();
    bildirimGizle(ogeler.yukleBildirim);
  });
});

ogeler.tutar.addEventListener('input', () => {
  hizliTutarlariGoster();
  bildirimGizle(ogeler.yukleBildirim);
});

ogeler.form.addEventListener('submit', bakiyeYukle);

ogeler.filtreler.addEventListener('click', (olay) => {
  const dugme = olay.target.closest('[data-filtre]');
  if (!dugme) return;
  durum.filtre = dugme.dataset.filtre;
  hareketleriGoster();
});

try {
  if (await oturumuBaslat()) {
    const veri = await api('/bakiye');
    durum.bakiye = veri.bakiye;
    durum.ozet = veri.ozet;
    durum.hareketler = veri.hareketler;
    ozetiGoster();
    hareketleriGoster();
  }
} catch (hata) {
  if (hata.durum !== 401) bildirimGoster(ogeler.bildirim, hata.message);
}
