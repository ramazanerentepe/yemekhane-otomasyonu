import { api } from '../api.js';
import { oturumuBaslat } from '../oturum.js';
import { bildirimGizle, bildirimGoster, metinYaz, paraBicimle } from '../yardimcilar.js';

const KARTTA_GOSTERILEN_YEMEK = 4;

const secim = { yemekhane: null, ogun: null, tarih: null };
const durum = { ogunler: [], hafta: null };
let haftaIstegi = 0;
let detayIstegi = 0;

const ogeler = {
  bildirim: document.querySelector('#sayfa-bildirim'),
  haftaMetni: document.querySelector('[data-hafta-metni]'),
  yemekhane: document.querySelector('#yemekhane'),
  ogunler: document.querySelector('[data-ogunler]'),
  gunler: document.querySelector('[data-gunler]'),
  detay: document.querySelector('[data-detay]'),
  detayYemekler: document.querySelector('[data-detay-yemekler]'),
  detayVejetaryen: document.querySelector('[data-detay-vejetaryen]'),
  detayPuan: document.querySelector('[data-detay-puan]'),
  detayYorumlar: document.querySelector('[data-detay-yorumlar]'),
  rezervasyon: document.querySelector('[data-rezervasyon]'),
};

const bicim = {
  gun: new Intl.DateTimeFormat('tr-TR', { day: 'numeric' }),
  gunAdi: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }),
  hafta: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
  baslik: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }),
  puan: new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  sayi: new Intl.NumberFormat('tr-TR'),
};

const ikiHane = (sayi) => String(sayi).padStart(2, '0');

const isoTarih = (tarih) =>
  `${tarih.getFullYear()}-${ikiHane(tarih.getMonth() + 1)}-${ikiHane(tarih.getDate())}`;

function tarihOku(metin) {
  const [yil, ay, gun] = metin.split('-').map(Number);
  return new Date(yil, ay - 1, gun);
}

function gunEkle(tarih, gun) {
  return new Date(tarih.getFullYear(), tarih.getMonth(), tarih.getDate() + gun);
}

const sablondanKopyala = (id) => document.getElementById(id).content.firstElementChild.cloneNode(true);

function eleman(etiket, sinif, metin) {
  const yeni = document.createElement(etiket);
  if (sinif) yeni.className = sinif;
  if (metin !== undefined) yeni.textContent = metin;
  return yeni;
}

function yildizlar(puan) {
  const dolu = Math.round(puan);
  const kutu = eleman('span', 'yildizlar', '★'.repeat(dolu));
  kutu.setAttribute('role', 'img');
  kutu.setAttribute('aria-label', `5 üzerinden ${bicim.puan.format(puan)} puan`);
  kutu.append(eleman('span', 'yildizlar__bos', '★'.repeat(5 - dolu)));
  return kutu;
}

function puaniYaz(hedef, menu, oySayisiGoster) {
  if (menu.ortalama_puan === null) {
    hedef.textContent = 'Henüz puan yok';
    return;
  }
  hedef.replaceChildren(yildizlar(menu.ortalama_puan), ` ${bicim.puan.format(menu.ortalama_puan)}`);
  if (oySayisiGoster) hedef.append(' ', eleman('small', '', `(${menu.oy_sayisi} oy)`));
}

function servisMetni(ogunId) {
  const ogun = durum.ogunler.find((o) => o.id === ogunId);
  return ogun ? `${ogun.servis_baslangic}–${ogun.servis_bitis}` : '';
}

function varsayilanOgun(ogunler) {
  const simdi = `${ikiHane(new Date().getHours())}:${ikiHane(new Date().getMinutes())}`;
  return (ogunler.find((ogun) => ogun.servis_bitis > simdi) ?? ogunler.at(-1)).id;
}

function secenekleriDoldur(yemekhaneler, ogunler) {
  ogeler.yemekhane.replaceChildren(...yemekhaneler.map((y) => new Option(y.ad, y.id)));
  secim.yemekhane = yemekhaneler[0].id;

  ogeler.ogunler.replaceChildren(
    ...ogunler.map((ogun) => {
      const dugme = eleman('button', 'ogun-secici__secenek', ogun.ad);
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
    etiket.textContent = 'Sona erdi';
  }

  if (!menu) return kart;

  const liste = kart.querySelector('[data-yemekler]');
  menu.yemekler.slice(0, KARTTA_GOSTERILEN_YEMEK).forEach((ad) => liste.append(eleman('li', '', ad)));
  const kalan = menu.yemekler.length - KARTTA_GOSTERILEN_YEMEK;
  if (kalan > 0) liste.append(eleman('li', 'gun-karti__fazla', `+${kalan} yemek`));

  kart.querySelector('[data-servis]').textContent = servisMetni(istek.ogun);
  kart.querySelector('[data-fiyat]').textContent = paraBicimle(menu.fiyat);
  puaniYaz(kart.querySelector('[data-puan]'), menu, false);

  kart.addEventListener('click', () => detayiAc(tarih, menu, istek));
  return kart;
}

function haftayiGoster(hafta, istek) {
  durum.hafta = hafta;
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

function detayYemekSatiri(yemek) {
  const satir = sablondanKopyala('detay-yemek-sablonu');
  satir.querySelector('[data-ad]').textContent = yemek.ad;
  satir.querySelector('[data-kalori]').textContent = `${yemek.kalori} kcal`;
  satir.querySelector('[data-etiketler]').append(
    ...yemek.alerjenler.map((alerjen) => eleman('span', 'rozet rozet--alerjen', alerjen))
  );
  return satir;
}

function yorumKutusu(yorum) {
  const kutu = sablondanKopyala('yorum-sablonu');
  kutu.querySelector('[data-yildizlar]').append(yildizlar(yorum.puan));
  kutu.querySelector('[data-kisi]').textContent = yorum.kullanici;

  const metin = kutu.querySelector('[data-metin]');
  if (yorum.yorum) metin.textContent = yorum.yorum;
  else metin.remove();

  return kutu;
}

function rezervasyonUyarisi(ozet) {
  if (!ozet.rezervasyon_acik) return 'Bu menü için rezervasyon süresi doldu.';
  if (ozet.bos_yer <= 0) return 'Yemekhane kapasitesi dolu.';
  return '';
}

function detayiDoldur(tarih, ozet, menu, yorumlar) {
  metinYaz('[data-detay-tarih]', bicim.baslik.format(tarih));
  metinYaz('[data-detay-alt]', `${menu.ogun} · ${menu.yemekhane}`);
  ogeler.detayYemekler.replaceChildren(...menu.yemekler.map(detayYemekSatiri));

  metinYaz('[data-detay-kalori]', `${bicim.sayi.format(menu.toplam_kalori)} kcal`);
  ogeler.detayVejetaryen.classList.toggle('cip--vejetaryen', menu.vejetaryen);
  ogeler.detayVejetaryen.querySelector('span').textContent = menu.vejetaryen ? 'Vejetaryen' : 'Vejetaryen değil';
  metinYaz('[data-detay-servis]', `${menu.servis_baslangic}–${menu.servis_bitis}`);
  metinYaz('[data-detay-son]', menu.rezervasyon_son);
  metinYaz('[data-detay-bos-yer]', ozet.bos_yer);

  metinYaz('[data-detay-fiyat]', paraBicimle(menu.fiyat));
  puaniYaz(ogeler.detayPuan, ozet, true);

  const uyari = rezervasyonUyarisi(ozet);
  ogeler.rezervasyon.disabled = uyari !== '';
  metinYaz('[data-detay-uyari]', uyari);

  metinYaz('[data-yorum-sayisi]', yorumlar.length > 0 ? `(${yorumlar.length})` : '');
  if (yorumlar.length > 0) {
    ogeler.detayYorumlar.replaceChildren(...yorumlar.map(yorumKutusu));
  } else {
    const mesaj = isoTarih(tarih) < durum.hafta.bugun
      ? 'Bu menü için henüz yorum yok.'
      : 'Yorumlar menü servis edildikten sonra görünür.';
    ogeler.detayYorumlar.replaceChildren(eleman('p', 'detay__yorumlar-bos', mesaj));
  }
}

async function detayiAc(tarih, ozet, istek) {
  const istekNo = ++detayIstegi;
  const sorgu = new URLSearchParams({
    yemekhane: istek.yemekhane,
    tarih: isoTarih(tarih),
    ogun: istek.ogun,
  });

  try {
    const [menu, yorumlar] = await Promise.all([
      api(`/menu?${sorgu}`),
      api(`/menuler/${ozet.id}/yorumlar`),
    ]);
    if (istekNo !== detayIstegi) return;

    detayiDoldur(tarih, ozet, menu, yorumlar);
    ogeler.detay.querySelector('.detay__govde').scrollTop = 0;
    if (!ogeler.detay.open) ogeler.detay.showModal();
  } catch (hata) {
    if (istekNo === detayIstegi) bildirimGoster(ogeler.bildirim, hata.message);
  }
}

function detayiKapat() {
  detayIstegi += 1;
  ogeler.detay.close();
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

document.querySelector('[data-detay-kapat]').addEventListener('click', detayiKapat);

ogeler.detay.addEventListener('click', (olay) => {
  if (olay.target !== ogeler.detay) return;
  const kutu = ogeler.detay.getBoundingClientRect();
  const disarida = olay.clientX < kutu.left || olay.clientX > kutu.right
    || olay.clientY < kutu.top || olay.clientY > kutu.bottom;
  if (disarida) detayiKapat();
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
