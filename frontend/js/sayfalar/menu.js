import { api } from '../api.js';
import { menuDetayiOlustur } from '../menu-detay.js';
import { bakiyeyiGoster, oturumuBaslat } from '../oturum.js';
import {
  bildirimGizle,
  bildirimGoster,
  eleman,
  gunEkle,
  isoTarih,
  paraBicimle,
  puaniYaz,
  simdikiSaat,
  tarihOku,
} from '../yardimcilar.js';

const KARTTA_GOSTERILEN_YEMEK = 4;

const secim = { yemekhane: null, ogun: null, tarih: null };
const durum = { ogunler: [], hafta: null, istek: null };
let haftaIstegi = 0;

const detay = menuDetayiOlustur();

const ogeler = {
  bildirim: document.querySelector('#sayfa-bildirim'),
  haftaMetni: document.querySelector('[data-hafta-metni]'),
  yemekhane: document.querySelector('#yemekhane'),
  ogunler: document.querySelector('[data-ogunler]'),
  gunler: document.querySelector('[data-gunler]'),
};

const bicim = {
  gun: new Intl.DateTimeFormat('tr-TR', { day: 'numeric' }),
  gunAdi: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }),
  hafta: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
};

const sablondanKopyala = (id) => document.getElementById(id).content.firstElementChild.cloneNode(true);

function servisMetni(ogunId) {
  const ogun = durum.ogunler.find((o) => o.id === ogunId);
  return ogun ? `${ogun.servis_baslangic}–${ogun.servis_bitis}` : '';
}

function varsayilanOgun(ogunler) {
  const simdi = simdikiSaat();
  return (ogunler.find((ogun) => ogun.servis_bitis > simdi) ?? ogunler.at(-1)).id;
}

function secenekleriDoldur(yemekhaneler, ogunler) {
  ogeler.yemekhane.replaceChildren(...yemekhaneler.map((y) => new Option(y.ad, y.id)));
  secim.yemekhane = yemekhaneler[0].id;

  ogeler.ogunler.replaceChildren(
    ...ogunler.map((ogun) => {
      const dugme = eleman('button', 'segment__secenek', ogun.ad);
      dugme.type = 'button';
      dugme.dataset.ogun = ogun.id;
      return dugme;
    })
  );
  durum.ogunler = ogunler;
  secim.ogun = varsayilanOgun(ogunler);
}

function ogunSeciminiGoster() {
  ogeler.ogunler.querySelectorAll('[data-ogun]').forEach((dugme) => {
    dugme.setAttribute('aria-pressed', String(Number(dugme.dataset.ogun) === secim.ogun));
  });
}

function gunKarti(tarih, menu, istek) {
  const iso = isoTarih(tarih);
  const { bugun } = durum.hafta;
  const kart = sablondanKopyala(menu ? 'gun-karti-sablonu' : 'bos-gun-sablonu');

  kart.querySelector('[data-gun]').textContent = bicim.gun.format(tarih);
  kart.querySelector('[data-gun-adi]').textContent = bicim.gunAdi.format(tarih);

  const etiket = kart.querySelector('[data-etiket]');
  if (iso === bugun) {
    kart.classList.add('gun-karti--bugun');
    etiket.append(eleman('span', 'rozet rozet--ana', 'Bugün'));
  } else if (iso < bugun) {
    kart.classList.add('gun-karti--gecmis');
    etiket.append('Sona erdi');
  }
  if (menu?.rezerve_edildi) etiket.prepend(eleman('span', 'rozet rozet--basari', 'Rezerve'));

  if (!menu) return kart;

  const liste = kart.querySelector('[data-yemekler]');
  menu.yemekler.slice(0, KARTTA_GOSTERILEN_YEMEK).forEach((ad) => liste.append(eleman('li', '', ad)));
  const kalan = menu.yemekler.length - KARTTA_GOSTERILEN_YEMEK;
  if (kalan > 0) liste.append(eleman('li', 'gun-karti__fazla', `+${kalan} yemek`));

  kart.querySelector('[data-servis]').textContent = servisMetni(istek.ogun);
  kart.querySelector('[data-fiyat]').textContent = paraBicimle(menu.fiyat);
  puaniYaz(kart.querySelector('[data-puan]'), menu, false);

  kart.addEventListener('click', () => detayiAc(iso, menu, istek));
  return kart;
}

function haftayiGoster(hafta, istek) {
  durum.hafta = hafta;
  durum.istek = istek;
  const baslangic = tarihOku(hafta.baslangic);
  ogeler.haftaMetni.textContent = bicim.hafta.formatRange(baslangic, tarihOku(hafta.bitis));

  const menuler = new Map(hafta.menuler.map((menu) => [menu.tarih, menu]));
  const kartlar = Array.from({ length: 7 }, (_, sira) => {
    const tarih = gunEkle(baslangic, sira);
    return gunKarti(tarih, menuler.get(isoTarih(tarih)), istek);
  });
  ogeler.gunler.replaceChildren(...kartlar);
}

async function haftayiYukle() {
  ogunSeciminiGoster();
  bildirimGizle(ogeler.bildirim);

  const istekNo = ++haftaIstegi;
  const istek = { yemekhane: secim.yemekhane, ogun: secim.ogun };
  const sorgu = new URLSearchParams(istek);
  if (secim.tarih) sorgu.set('tarih', secim.tarih);

  try {
    const hafta = await api(`/menuler/hafta?${sorgu}`);
    if (istekNo === haftaIstegi) haftayiGoster(hafta, istek);
  } catch (hata) {
    if (istekNo === haftaIstegi) bildirimGoster(ogeler.bildirim, hata.message);
  }
}

function rezervasyonEylemi(menu) {
  if (menu.rezerve_edildi) {
    return menu.rezervasyon_acik
      ? { dugme: { metin: 'İptal et', aktif: true }, mesaj: 'Bu menü için rezervasyonunuz var.', mesajTuru: 'basari' }
      : { dugme: { metin: 'Rezervasyonunuz var', aktif: false }, mesaj: 'Bu menü için rezervasyonunuz var.', mesajTuru: 'basari' };
  }
  if (!menu.rezervasyon_acik) {
    return { dugme: { metin: 'Rezervasyon yap', aktif: false }, mesaj: 'Bu menü için rezervasyon süresi doldu.' };
  }
  if (menu.bos_yer <= 0) {
    return { dugme: { metin: 'Rezervasyon yap', aktif: false }, mesaj: 'Yemekhane kapasitesi dolu.' };
  }
  return { dugme: { metin: 'Rezervasyon yap', aktif: true } };
}

async function detayiAc(tarih, menu, istek) {
  try {
    await detay.ac({
      tarih,
      bugun: durum.hafta.bugun,
      yemekhaneId: istek.yemekhane,
      ogunId: istek.ogun,
      menuId: menu.id,
      puan: menu,
      bosYer: menu.bos_yer,
      eylem: rezervasyonEylemi(menu),
      dugmeyeTiklaninca: () => (menu.rezerve_edildi ? iptaleYonlendir(menu) : rezervasyonYap(menu)),
    });
  } catch (hata) {
    bildirimGoster(ogeler.bildirim, hata.message);
  }
}

function iptaleYonlendir(menu) {
  window.location.href = `/rezervasyonlarim.html?rezervasyon=${menu.rezervasyon_id}`;
}

async function rezervasyonYap(menu) {
  detay.eylemiGoster({ dugme: { metin: 'İşleniyor…', aktif: false } });

  try {
    const sonuc = await api('/rezervasyonlar', { method: 'POST', govde: { menu_id: menu.id } });
    menu.rezerve_edildi = true;
    menu.rezervasyon_id = sonuc.rezervasyon_id;
    menu.bos_yer -= 1;
    bakiyeyiGoster(sonuc.bakiye);
    detay.bosYeriGoster(menu.bos_yer);
    detay.eylemiGoster({
      dugme: { metin: 'İptal et', aktif: true },
      mesaj: `${sonuc.mesaj} Yeni bakiye: ${paraBicimle(sonuc.bakiye)}`,
      mesajTuru: 'basari',
    });
    haftayiGoster(durum.hafta, durum.istek);
  } catch (hata) {
    detay.eylemiGoster({ ...rezervasyonEylemi(menu), mesaj: hata.message });
  }
}

document.querySelectorAll('[data-hafta]').forEach((dugme) => {
  dugme.addEventListener('click', () => {
    const fark = Number(dugme.dataset.hafta);
    if (fark === 0) {
      secim.tarih = null;
    } else if (durum.hafta) {
      secim.tarih = isoTarih(gunEkle(tarihOku(durum.hafta.baslangic), fark * 7));
    }
    haftayiYukle();
  });
});

ogeler.yemekhane.addEventListener('change', () => {
  secim.yemekhane = Number(ogeler.yemekhane.value);
  haftayiYukle();
});

ogeler.ogunler.addEventListener('click', (olay) => {
  const dugme = olay.target.closest('[data-ogun]');
  if (!dugme) return;
  secim.ogun = Number(dugme.dataset.ogun);
  haftayiYukle();
});

try {
  if (await oturumuBaslat()) {
    const [yemekhaneler, ogunler] = await Promise.all([api('/yemekhaneler'), api('/ogunler')]);
    secenekleriDoldur(yemekhaneler, ogunler);
    await haftayiYukle();
  }
} catch (hata) {
  if (hata.durum !== 401) bildirimGoster(ogeler.bildirim, hata.message);
}
