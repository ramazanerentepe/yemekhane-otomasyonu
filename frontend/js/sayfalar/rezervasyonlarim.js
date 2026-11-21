import { api } from '../api.js';
import { menuDetayiOlustur } from '../menu-detay.js';
import { bakiyeyiGoster, oturumuBaslat } from '../oturum.js';
import {
  bildirimGizle,
  bildirimGoster,
  eleman,
  isoTarih,
  paraBicimle,
  tarihOku,
} from '../yardimcilar.js';

const BOS_MESAJLARI = {
  aktif: 'Yaklaşan bir rezervasyonun yok.',
  kullanildi: 'Henüz kullanılmış bir rezervasyonun yok.',
  iptal: 'İptal edilmiş bir rezervasyonun yok.',
  tumu: 'Henüz hiç rezervasyon yapmadın.',
};

const durum = { rezervasyonlar: [], filtre: 'aktif', secili: null, detaydaki: null };
const istenenRezervasyon = Number(new URLSearchParams(window.location.search).get('rezervasyon')) || null;

const detay = menuDetayiOlustur();

const ogeler = {
  bildirim: document.querySelector('#sayfa-bildirim'),
  filtreler: document.querySelector('[data-filtreler]'),
  liste: document.querySelector('[data-liste]'),
  bos: document.querySelector('[data-bos]'),
  bosMesaj: document.querySelector('[data-bos-mesaj]'),
  onay: document.querySelector('[data-onay]'),
  onayMetin: document.querySelector('[data-onay-metin]'),
  onayIptal: document.querySelector('[data-onay-iptal]'),
  sablon: document.querySelector('#rezervasyon-sablonu'),
};

const bicim = {
  gun: new Intl.DateTimeFormat('tr-TR', { day: 'numeric' }),
  ay: new Intl.DateTimeFormat('tr-TR', { month: 'short' }),
  gunAdi: new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }),
  uzun: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }),
  kisa: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }),
};

function kategori(rezervasyon) {
  if (rezervasyon.durum !== 'aktif') return rezervasyon.durum;
  return rezervasyon.servis_gecti ? 'gecmis' : 'aktif';
}

function iptalSonu(rezervasyon) {
  const gun = rezervasyon.tarih === isoTarih(new Date())
    ? 'bugün'
    : bicim.kisa.format(tarihOku(rezervasyon.tarih));
  return `İptal için son: ${gun} ${rezervasyon.iptal_son_saat}`;
}

function kartGorunumu(rezervasyon) {
  switch (kategori(rezervasyon)) {
    case 'iptal':
      return { sinif: 'iptal', rozet: 'İptal edildi', rozetTuru: '', not: 'Ücret iade edildi' };
    case 'kullanildi':
      return {
        sinif: 'gecmis',
        rozet: 'Kullanıldı',
        rozetTuru: 'basari',
        not: rezervasyon.degerlendirme
          ? `Puanın: ${'★'.repeat(rezervasyon.degerlendirme.puan)}${'☆'.repeat(5 - rezervasyon.degerlendirme.puan)}`
          : 'Henüz değerlendirmedin',
      };
    case 'gecmis':
      return { sinif: 'gecmis', rozet: 'Kullanılmadı', rozetTuru: '', not: 'Servis saati geçti' };
    default:
      return {
        sinif: 'aktif',
        rozet: 'Aktif',
        rozetTuru: 'ana',
        not: rezervasyon.iptal_edilebilir ? iptalSonu(rezervasyon) : 'İptal süresi doldu',
      };
  }
}

function detayEylemi(rezervasyon) {
  switch (kategori(rezervasyon)) {
    case 'iptal':
      return { mesaj: 'Bu rezervasyon iptal edildi, ücreti bakiyene iade edildi.', mesajTuru: 'bilgi' };
    case 'kullanildi':
      return { mesaj: 'Bu menüyü kullandın.', mesajTuru: 'basari' };
    case 'gecmis':
      return { mesaj: 'Servis saati geçti, rezervasyon kullanılmadı.', mesajTuru: 'bilgi' };
    default:
      return rezervasyon.iptal_edilebilir
        ? { dugme: { metin: 'İptal et', aktif: true }, mesaj: iptalSonu(rezervasyon), mesajTuru: 'bilgi' }
        : { dugme: { metin: 'İptal et', aktif: false }, mesaj: 'Bu rezervasyon için iptal süresi doldu.' };
  }
}

function rezervasyonSatiri(rezervasyon) {
  const satir = ogeler.sablon.content.firstElementChild.cloneNode(true);
  const tarih = tarihOku(rezervasyon.tarih);
  const { sinif, rozet, rozetTuru, not } = kartGorunumu(rezervasyon);

  satir.classList.add(`rezervasyon--${sinif}`);
  satir.querySelector('[data-gun]').textContent = bicim.gun.format(tarih);
  satir.querySelector('[data-ay]').textContent = bicim.ay.format(tarih);
  satir.querySelector('[data-baslik]').textContent = `${bicim.gunAdi.format(tarih)} · ${rezervasyon.ogun}`;
  satir.querySelector('[data-durum]').replaceWith(eleman('span', rozetTuru ? `rozet rozet--${rozetTuru}` : 'rozet', rozet));
  satir.querySelector('[data-yemekler]').textContent = rezervasyon.yemekler;
  satir.querySelector('[data-meta]').textContent =
    `${rezervasyon.yemekhane} · ${rezervasyon.servis_baslangic}–${rezervasyon.servis_bitis}`;
  satir.querySelector('[data-ucret]').textContent = paraBicimle(rezervasyon.ucret);
  satir.querySelector('[data-not]').textContent = not;

  satir.querySelector('[data-ac]').addEventListener('click', () => detayiAc(rezervasyon));

  const iptalDugmesi = satir.querySelector('[data-iptal]');
  if (rezervasyon.iptal_edilebilir) {
    iptalDugmesi.hidden = false;
    iptalDugmesi.addEventListener('click', () => onayiAc(rezervasyon));
  }

  return satir;
}

function sayilariGoster() {
  const sayilar = { aktif: 0, kullanildi: 0, iptal: 0, tumu: durum.rezervasyonlar.length };
  durum.rezervasyonlar.forEach((r) => {
    const tur = kategori(r);
    if (tur in sayilar) sayilar[tur] += 1;
  });

  ogeler.filtreler.querySelectorAll('[data-filtre]').forEach((dugme) => {
    dugme.setAttribute('aria-pressed', String(dugme.dataset.filtre === durum.filtre));
    dugme.querySelector('[data-sayi]').textContent = sayilar[dugme.dataset.filtre] || '';
  });
}

function listeyiGoster() {
  sayilariGoster();

  let gorunenler = durum.filtre === 'tumu'
    ? durum.rezervasyonlar
    : durum.rezervasyonlar.filter((r) => kategori(r) === durum.filtre);
  if (durum.filtre === 'aktif') gorunenler = [...gorunenler].reverse();

  ogeler.liste.replaceChildren(...gorunenler.map(rezervasyonSatiri));
  ogeler.bosMesaj.textContent = BOS_MESAJLARI[durum.filtre];
  ogeler.bos.hidden = gorunenler.length > 0;
}

async function detayiAc(rezervasyon) {
  durum.detaydaki = rezervasyon;
  try {
    await detay.ac({
      tarih: rezervasyon.tarih,
      bugun: isoTarih(new Date()),
      yemekhaneId: rezervasyon.yemekhane_id,
      ogunId: rezervasyon.ogun_id,
      menuId: rezervasyon.menu_id,
      fiyat: rezervasyon.ucret,
      puan: rezervasyon,
      eylem: detayEylemi(rezervasyon),
      dugmeyeTiklaninca: () => onayiAc(rezervasyon),
      degerlendirme: kategori(rezervasyon) === 'kullanildi'
        ? { mevcut: rezervasyon.degerlendirme, kaydet: (veri) => degerlendirmeKaydet(rezervasyon, veri) }
        : null,
    });
  } catch (hata) {
    bildirimGoster(ogeler.bildirim, hata.message);
  }
}

async function degerlendirmeKaydet(rezervasyon, { puan, yorum }) {
  const sonuc = await api('/degerlendirmeler', {
    method: 'POST',
    govde: { menu_id: rezervasyon.menu_id, puan, yorum },
  });
  rezervasyon.degerlendirme = sonuc.degerlendirme;
  rezervasyon.ortalama_puan = sonuc.ortalama_puan;
  rezervasyon.oy_sayisi = sonuc.oy_sayisi;
  listeyiGoster();
  return sonuc;
}

function onayiAc(rezervasyon) {
  durum.secili = rezervasyon;
  const tarih = bicim.uzun.format(tarihOku(rezervasyon.tarih));
  ogeler.onayMetin.textContent =
    `${tarih} · ${rezervasyon.ogun} (${rezervasyon.yemekhane}) rezervasyonun iptal edilecek ` +
    `ve ${paraBicimle(rezervasyon.ucret)} bakiyene iade edilecek.`;
  ogeler.onayIptal.disabled = false;
  ogeler.onayIptal.textContent = 'İptal et';
  ogeler.onay.showModal();
}

async function iptalEt() {
  const rezervasyon = durum.secili;
  if (!rezervasyon) return;

  ogeler.onayIptal.disabled = true;
  ogeler.onayIptal.textContent = 'İptal ediliyor…';
  const detayda = durum.detaydaki === rezervasyon;

  try {
    const sonuc = await api(`/rezervasyonlar/${rezervasyon.id}/iptal`, { method: 'POST' });
    rezervasyon.durum = 'iptal';
    rezervasyon.iptal_edilebilir = false;
    bakiyeyiGoster(sonuc.bakiye);

    const mesaj = `${sonuc.mesaj} ${paraBicimle(sonuc.iade)} iade edildi. Yeni bakiye: ${paraBicimle(sonuc.bakiye)}`;
    bildirimGoster(ogeler.bildirim, mesaj, 'basari');
    if (detayda) detay.eylemiGoster({ mesaj, mesajTuru: 'basari' });
  } catch (hata) {
    bildirimGoster(ogeler.bildirim, hata.message);
    if (detayda) detay.eylemiGoster({ ...detayEylemi(rezervasyon), mesaj: hata.message, mesajTuru: 'hata' });
  } finally {
    durum.secili = null;
    ogeler.onay.close();
    listeyiGoster();
  }
}

const bekle = (ms) => new Promise((coz) => { setTimeout(coz, ms); });
const rezervasyonuBul = (id) => durum.rezervasyonlar.find((r) => r.id === id);

async function istenenRezervasyonuAc(id) {
  window.history.replaceState(null, '', window.location.pathname);

  let rezervasyon = rezervasyonuBul(id);
  if (!rezervasyon) {
    await bekle(1000);
    durum.rezervasyonlar = await api('/rezervasyonlar');
    rezervasyon = rezervasyonuBul(id);
  }

  if (!rezervasyon) {
    listeyiGoster();
    bildirimGoster(ogeler.bildirim, 'Rezervasyon henüz listede görünmüyor. Birkaç saniye sonra sayfayı yenile.');
    return;
  }

  const tur = kategori(rezervasyon);
  durum.filtre = tur === 'gecmis' ? 'tumu' : tur;
  listeyiGoster();
  await detayiAc(rezervasyon);
}

ogeler.filtreler.addEventListener('click', (olay) => {
  const dugme = olay.target.closest('[data-filtre]');
  if (!dugme) return;
  durum.filtre = dugme.dataset.filtre;
  bildirimGizle(ogeler.bildirim);
  listeyiGoster();
});

document.querySelector('[data-onay-vazgec]').addEventListener('click', () => ogeler.onay.close());
ogeler.onayIptal.addEventListener('click', iptalEt);

try {
  if (await oturumuBaslat()) {
    durum.rezervasyonlar = await api('/rezervasyonlar');
    if (istenenRezervasyon) await istenenRezervasyonuAc(istenenRezervasyon);
    else listeyiGoster();
  }
} catch (hata) {
  if (hata.durum !== 401) bildirimGoster(ogeler.bildirim, hata.message);
}
