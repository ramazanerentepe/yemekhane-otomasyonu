import { api } from '../api.js';
import { menuDetayiOlustur } from '../menu-detay.js';
import { oturumuBaslat } from '../oturum.js';
import {
  bildirimGizle,
  bildirimGoster,
  eleman,
  gunEkle,
  isoTarih,
  paraBicimle,
  simdikiSaat,
  tarihOku,
} from '../yardimcilar.js';

const DOLULUK_YUKSEK = 90;
const DOLULUK_ORTA = 50;
const DAR_EKRAN = window.matchMedia('(max-width: 1100px)');

const secim = { yemekhane: null, ogun: null, tarih: null };
const durum = { ogunler: [], yemekKalorisi: new Map(), rapor: null, istek: null };
const form = { menu: null, ogun: null, yemekler: new Set(), ilk: null, ilkHal: '' };
let bekleyenGecis = null;
let raporIstegi = 0;

const detay = menuDetayiOlustur();

const ogeler = {
  bildirim: document.querySelector('#sayfa-bildirim'),
  ozet: document.querySelectorAll('[data-ozet]'),
  raporYemekhane: document.querySelector('#rapor-yemekhane'),
  raporOgunler: document.querySelector('[data-rapor-ogunler]'),
  haftaMetni: document.querySelector('[data-hafta-metni]'),
  rapor: document.querySelector('[data-rapor]'),
  form: document.querySelector('[data-menu-formu]'),
  formBaslik: document.querySelector('[data-form-baslik]'),
  formRozet: document.querySelector('[data-form-rozet]'),
  tarih: document.querySelector('#form-tarih'),
  yemekhane: document.querySelector('#form-yemekhane'),
  ogrenciFiyati: document.querySelector('#form-ogrenci'),
  personelFiyati: document.querySelector('#form-personel'),
  formOgunler: document.querySelector('[data-form-ogunler]'),
  yemekSecimi: document.querySelector('[data-yemek-secimi]'),
  uyari: document.querySelector('[data-form-uyari]'),
  formBildirim: document.querySelector('[data-form-bildirim]'),
  formGovde: document.querySelector('[data-form-govde]'),
  formOzet: document.querySelector('[data-form-ozet]'),
  kaydet: document.querySelector('[data-kaydet]'),
  eskiHal: document.querySelector('[data-eski-hal]'),
  renkAciklamasi: document.querySelector('[data-renk-aciklamasi]'),
  onay: document.querySelector('[data-onay]'),
  onayMetin: document.querySelector('[data-onay-metin]'),
};

const bicim = {
  gun: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }),
  gunAdi: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }),
  uzunGun: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }),
  hafta: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
  sayi: new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }),
  puan: new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  fiyat: new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }),
};

const sablondanKopyala = (id) => document.getElementById(id).content.firstElementChild.cloneNode(true);
const ogunAdi = (ogunId) => durum.ogunler.find((ogun) => ogun.id === ogunId)?.ad ?? '';

function ikon(ad) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'ikon');
  svg.setAttribute('aria-hidden', 'true');
  const kullan = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  kullan.setAttribute('href', `/img/ikonlar.svg#${ad}`);
  svg.append(kullan);
  return svg;
}

function yildiz() {
  return eleman('span', 'yildizlar', '★');
}

function ogunAcikMi(iso, ogunId) {
  const ogun = durum.ogunler.find((o) => o.id === ogunId);
  const { bugun } = durum.rapor;
  return Boolean(ogun) && (iso > bugun || (iso === bugun && simdikiSaat() < ogun.son_saat));
}

function varsayilanOgun(ogunler) {
  const simdi = simdikiSaat();
  return (ogunler.find((ogun) => ogun.servis_bitis > simdi) ?? ogunler.at(-1)).id;
}

function ogunDugmeleri(hedef, ogunler) {
  hedef.replaceChildren(
    ...ogunler.map((ogun) => {
      const dugme = eleman('button', 'segment__secenek', ogun.ad);
      dugme.type = 'button';
      dugme.dataset.ogun = ogun.id;
      return dugme;
    })
  );
}

function ogunSeciminiGoster(hedef, ogunId, kilitli = false) {
  hedef.querySelectorAll('[data-ogun]').forEach((dugme) => {
    dugme.setAttribute('aria-pressed', String(Number(dugme.dataset.ogun) === ogunId));
    dugme.disabled = kilitli;
  });
}

function secenekleriDoldur(yemekhaneler, ogunler) {
  const secenekler = () => yemekhaneler.map((y) => new Option(y.ad, y.id));
  ogeler.raporYemekhane.replaceChildren(...secenekler());
  ogeler.yemekhane.replaceChildren(...secenekler());
  secim.yemekhane = yemekhaneler[0].id;

  durum.ogunler = ogunler;
  ogunDugmeleri(ogeler.raporOgunler, ogunler);
  ogunDugmeleri(ogeler.formOgunler, ogunler);
  secim.ogun = varsayilanOgun(ogunler);
}

function ciplerOlustur(kategoriler) {
  ogeler.yemekSecimi.replaceChildren(
    ...kategoriler.map((kategori) => {
      const grup = eleman('div', 'yemek-grubu');
      const liste = eleman('div', 'yemek-grubu__liste');
      liste.setAttribute('role', 'group');
      liste.setAttribute('aria-label', kategori.ad);

      kategori.yemekler.forEach((yemek) => {
        durum.yemekKalorisi.set(yemek.id, yemek.kalori);
        const cip = eleman('button', 'yemek-cipi');
        cip.type = 'button';
        cip.dataset.yemek = yemek.id;
        cip.append(ikon('arti'), yemek.ad);
        liste.append(cip);
      });

      grup.append(eleman('span', 'yemek-grubu__ad', kategori.ad), liste);
      return grup;
    })
  );
}

function cipleriGuncelle() {
  const duzenleme = form.menu !== null;
  const ilkYemekler = form.ilk?.yemekler ?? new Set();
  let eklenen = 0;
  let cikarilan = 0;

  ogeler.yemekSecimi.querySelectorAll('[data-yemek]').forEach((cip) => {
    const id = Number(cip.dataset.yemek);
    const secili = form.yemekler.has(id);
    const yeniEklendi = duzenleme && secili && !ilkYemekler.has(id);
    const cikarildi = duzenleme && !secili && ilkYemekler.has(id);
    if (yeniEklendi) eklenen += 1;
    if (cikarildi) cikarilan += 1;

    cip.setAttribute('aria-pressed', String(secili));
    cip.classList.toggle('yemek-cipi--eklenen', yeniEklendi);
    cip.classList.toggle('yemek-cipi--cikarilan', cikarildi);
    cip.title = yeniEklendi ? 'Yeni eklendi' : cikarildi ? 'Menüden çıkarıldı' : '';
    cip.querySelector('use').setAttribute('href', `/img/ikonlar.svg#${secili ? 'onay' : 'arti'}`);
  });

  const kalori = [...form.yemekler].reduce((toplam, id) => toplam + (durum.yemekKalorisi.get(id) ?? 0), 0);
  const parcalar = form.yemekler.size === 0
    ? ['Yemek seçilmedi']
    : [`${form.yemekler.size} yemek`, `${kalori.toLocaleString('tr-TR')} kcal`];
  if (eklenen) parcalar.push(`${eklenen} eklendi`);
  if (cikarilan) parcalar.push(`${cikarilan} çıkarıldı`);
  ogeler.formOzet.textContent = parcalar.join(' · ');
  ogeler.renkAciklamasi.hidden = !duzenleme;
  degisiklikDurumunuGoster();
}

function ozetiGoster(ozet) {
  ogeler.ozet.forEach((hedef) => {
    const deger = ozet[hedef.dataset.ozet];
    if (deger === null || deger === undefined) {
      hedef.textContent = '—';
    } else if (hedef.dataset.ozet === 'ortalama_doluluk') {
      hedef.textContent = `%${bicim.sayi.format(deger)}`;
    } else if (hedef.dataset.ozet === 'ortalama_puan') {
      hedef.replaceChildren(`${bicim.puan.format(deger)} `, yildiz());
    } else {
      hedef.textContent = deger.toLocaleString('tr-TR');
    }
  });
}

function dolulukCubugu(menu) {
  const yuzde = Number(menu.doluluk_yuzde);
  const metin = eleman('span', 'doluluk__metin');
  metin.append(eleman('span', '', `${menu.rezerve}/${menu.kapasite}`), eleman('strong', '', `%${bicim.sayi.format(yuzde)}`));

  const dolgu = eleman('span', 'doluluk__dolgu');
  if (yuzde >= DOLULUK_YUKSEK) dolgu.classList.add('doluluk__dolgu--yuksek');
  else if (yuzde >= DOLULUK_ORTA) dolgu.classList.add('doluluk__dolgu--orta');
  dolgu.style.width = `${Math.min(yuzde, 100)}%`;

  const cubuk = eleman('span', 'doluluk__cubuk');
  cubuk.setAttribute('role', 'img');
  cubuk.setAttribute('aria-label', `Doluluk yüzde ${bicim.sayi.format(yuzde)}`);
  cubuk.append(dolgu);
  return [metin, cubuk];
}

function puanHucresi(hedef, menu, gecmis) {
  if (menu.ortalama_puan === null) {
    hedef.append(eleman('span', 'sonuc-yok', gecmis ? 'Oy yok' : 'Henüz yok'));
    return;
  }
  hedef.append(yildiz(), ` ${bicim.puan.format(menu.ortalama_puan)}`, eleman('small', '', `${menu.oy_sayisi} oy`));
}

function eylemDugmesi(metin, tiklaninca) {
  const dugme = eleman('button', 'dugme dugme--ikincil', metin);
  dugme.type = 'button';
  dugme.addEventListener('click', tiklaninca);
  return dugme;
}

function raporSatiri(tarih, menu, istek) {
  const iso = isoTarih(tarih);
  const { bugun } = durum.rapor;
  const satir = sablondanKopyala('rapor-satiri-sablonu');

  satir.querySelector('[data-gun]').textContent = bicim.gun.format(tarih);
  const gunAdi = satir.querySelector('[data-gun-adi]');
  gunAdi.textContent = bicim.gunAdi.format(tarih);
  if (iso === bugun) gunAdi.append(' · ', eleman('span', 'bugun', 'Bugün'));

  const eylem = satir.querySelector('[data-eylem]');

  if (!menu) {
    satir.classList.add('rapor-satiri--bos');
    satir.querySelector('[data-yemekler]').textContent = 'Menü yok';
    eylem.append(
      ogunAcikMi(iso, istek.ogun)
        ? eylemDugmesi('Oluştur', () => degisikliklerSorulup(() => yeniMenuFormu(iso, true)))
        : eleman('span', 'gecti', '—')
    );
    return satir;
  }

  satir.dataset.menuId = menu.id;
  satir.classList.add('rapor-satiri--tiklanir');
  satir.tabIndex = 0;
  satir.setAttribute('aria-label', `${bicim.uzunGun.format(tarih)} menüsünün ayrıntıları`);
  satir.addEventListener('click', (olay) => {
    if (!olay.target.closest('button')) detayiAc(menu);
  });
  satir.addEventListener('keydown', (olay) => {
    if (olay.target === satir && (olay.key === 'Enter' || olay.key === ' ')) {
      olay.preventDefault();
      detayiAc(menu);
    }
  });
  const yemekler = menu.yemekler.map((yemek) => yemek.ad).join(', ');
  const yemekHucresi = satir.querySelector('[data-yemekler]');
  yemekHucresi.textContent = yemekler;
  yemekHucresi.title = yemekler;
  satir.querySelector('[data-doluluk]').append(...dolulukCubugu(menu));
  puanHucresi(satir.querySelector('[data-puan]'), menu, iso < bugun);
  eylem.append(
    menu.duzenlenebilir
      ? eylemDugmesi('Düzenle', () => menuyuDuzenle(menu))
      : eleman('span', 'gecti', 'Geçti')
  );
  return satir;
}

function detayEylemi(menu) {
  const doluluk = `${menu.rezerve} rezervasyon · doluluk %${bicim.sayi.format(menu.doluluk_yuzde)}`;
  return menu.duzenlenebilir
    ? { dugme: { metin: 'Düzenle', aktif: true }, mesaj: doluluk, mesajTuru: 'bilgi' }
    : { mesaj: `${doluluk} · Rezervasyon süresi geçtiği için düzenlenemez.`, mesajTuru: 'bilgi' };
}

async function detayiAc(menu) {
  try {
    await detay.ac({
      tarih: menu.tarih,
      bugun: durum.rapor.bugun,
      yemekhaneId: menu.yemekhane_id,
      ogunId: menu.ogun_id,
      menuId: menu.id,
      fiyatMetni: `Öğrenci ${paraBicimle(menu.ogrenci_fiyati)} · Personel ${paraBicimle(menu.personel_fiyati)}`,
      puan: menu,
      bosYer: menu.bos_yer,
      eylem: detayEylemi(menu),
      dugmeyeTiklaninca: () => {
        detay.kapat();
        menuyuDuzenle(menu);
      },
      degerlendirme: null,
    });
  } catch (hata) {
    bildirimGoster(ogeler.bildirim, hata.message);
  }
}

function satirlariIsaretle() {
  ogeler.rapor.querySelectorAll('[data-menu-id]').forEach((satir) => {
    satir.classList.toggle('rapor-satiri--secili', Number(satir.dataset.menuId) === form.menu?.id);
  });
}

function raporuGoster(rapor, istek) {
  durum.rapor = rapor;
  durum.istek = istek;
  const baslangic = tarihOku(rapor.baslangic);
  ogeler.haftaMetni.textContent = bicim.hafta.formatRange(baslangic, tarihOku(rapor.bitis));
  ogeler.tarih.min = rapor.bugun;
  ozetiGoster(rapor.ozet);

  const menuler = new Map(rapor.menuler.map((menu) => [menu.tarih, menu]));
  ogeler.rapor.replaceChildren(
    ...Array.from({ length: 7 }, (_, sira) => {
      const tarih = gunEkle(baslangic, sira);
      return raporSatiri(tarih, menuler.get(isoTarih(tarih)), istek);
    })
  );
  satirlariIsaretle();
}

async function raporuYukle() {
  ogunSeciminiGoster(ogeler.raporOgunler, secim.ogun);
  bildirimGizle(ogeler.bildirim);

  const istekNo = ++raporIstegi;
  const istek = { yemekhane: secim.yemekhane, ogun: secim.ogun };
  const sorgu = new URLSearchParams(istek);
  if (secim.tarih) sorgu.set('tarih', secim.tarih);

  try {
    const rapor = await api(`/yonetici/rapor?${sorgu}`);
    if (istekNo === raporIstegi) raporuGoster(rapor, istek);
  } catch (hata) {
    if (istekNo === raporIstegi) bildirimGoster(ogeler.bildirim, hata.message);
  }
}

function varsayilanTarih() {
  const { rapor, istek } = durum;
  const dolu = new Set(rapor.menuler.map((menu) => menu.tarih));
  const baslangic = tarihOku(rapor.baslangic);

  for (let sira = 0; sira < 7; sira += 1) {
    const iso = isoTarih(gunEkle(baslangic, sira));
    if (!dolu.has(iso) && ogunAcikMi(iso, istek.ogun)) return iso;
  }
  return '';
}

function fiyatlariYaz(menu) {
  ogeler.ogrenciFiyati.value = menu ? bicim.fiyat.format(menu.ogrenci_fiyati) : '';
  ogeler.personelFiyati.value = menu ? bicim.fiyat.format(menu.personel_fiyati) : '';
}

function formuGoster() {
  const duzenleme = form.menu !== null;
  ogeler.formBaslik.textContent = duzenleme ? 'Menüyü düzenle' : 'Yeni menü';
  ogeler.formRozet.hidden = !duzenleme;
  if (duzenleme) {
    ogeler.formRozet.textContent = `${bicim.uzunGun.format(tarihOku(form.menu.tarih))} · ${ogunAdi(form.menu.ogun_id)}`;
  }

  ogeler.tarih.disabled = duzenleme;
  ogeler.yemekhane.disabled = duzenleme;
  ogunSeciminiGoster(ogeler.formOgunler, form.ogun, duzenleme);

  const rezerve = form.menu?.rezerve ?? 0;
  ogeler.uyari.hidden = rezerve === 0;
  ogeler.uyari.querySelector('span').textContent =
    `Bu menüde ${rezerve} rezervasyon var. Fiyat değişikliği yalnızca yeni rezervasyonlara uygulanır.`;

  cipleriGuncelle();
  satirlariIsaretle();
}

function formunHali() {
  return JSON.stringify([
    ogeler.tarih.value,
    ogeler.yemekhane.value,
    form.ogun,
    ogeler.ogrenciFiyati.value.trim(),
    ogeler.personelFiyati.value.trim(),
    [...form.yemekler].sort((a, b) => a - b),
  ]);
}

const degisiklikVar = () => form.ilk !== null && formunHali() !== form.ilkHal;

function degisiklikDurumunuGoster() {
  ogeler.eskiHal.disabled = !degisiklikVar();
}

function ilkHaliKaydet() {
  form.ilk = {
    tarih: ogeler.tarih.value,
    yemekhane: ogeler.yemekhane.value,
    ogun: form.ogun,
    ogrenciFiyati: ogeler.ogrenciFiyati.value,
    personelFiyati: ogeler.personelFiyati.value,
    yemekler: new Set(form.yemekler),
  };
  form.ilkHal = formunHali();
  cipleriGuncelle();
}

function eskiHaleGetir() {
  const { ilk } = form;
  ogeler.tarih.value = ilk.tarih;
  ogeler.yemekhane.value = ilk.yemekhane;
  form.ogun = ilk.ogun;
  ogeler.ogrenciFiyati.value = ilk.ogrenciFiyati;
  ogeler.personelFiyati.value = ilk.personelFiyati;
  form.yemekler = new Set(ilk.yemekler);
  bildirimGizle(ogeler.formBildirim);
  formuGoster();
}

function degisikliklerSorulup(gecis) {
  if (!degisiklikVar()) {
    gecis();
    return;
  }

  bekleyenGecis = gecis;
  ogeler.onayMetin.textContent = form.menu
    ? `${bicim.uzunGun.format(tarihOku(form.menu.tarih))} · ${ogunAdi(form.menu.ogun_id)} menüsünde yaptığın değişiklikler kaybolacak.`
    : 'Yeni menü için girdiğin bilgiler kaybolacak.';
  ogeler.onay.showModal();
}

function menuyuDuzenle(menu) {
  if (form.menu?.id === menu.id) {
    formaKaydir(true);
    return;
  }
  degisikliklerSorulup(() => formuDuzenlemeyeAc(menu, true));
}

function formaKaydir(kaydir) {
  if (kaydir && DAR_EKRAN.matches) ogeler.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function yeniMenuFormu(tarih = varsayilanTarih(), kaydir = false, ornekMenu = durum.rapor.menuler.at(-1)) {
  form.menu = null;
  form.ogun = durum.istek.ogun;
  form.yemekler = new Set();
  ogeler.tarih.value = tarih;
  ogeler.yemekhane.value = durum.istek.yemekhane;
  fiyatlariYaz(ornekMenu);
  bildirimGizle(ogeler.formBildirim);
  form.ilk = null;
  formuGoster();
  ilkHaliKaydet();
  ogeler.formGovde.scrollTop = 0;
  formaKaydir(kaydir);
}

function formuDuzenlemeyeAc(menu, kaydir = false) {
  form.menu = menu;
  form.ogun = menu.ogun_id;
  form.yemekler = new Set(menu.yemekler.map((yemek) => yemek.id));
  ogeler.tarih.value = menu.tarih;
  ogeler.yemekhane.value = menu.yemekhane_id;
  fiyatlariYaz(menu);
  bildirimGizle(ogeler.formBildirim);
  form.ilk = null;
  formuGoster();
  ilkHaliKaydet();
  ogeler.formGovde.scrollTop = 0;
  formaKaydir(kaydir);
}

function raporaIsle(menu, yeni) {
  const { rapor, istek } = durum;
  const buHafta = menu.tarih >= rapor.baslangic && menu.tarih <= rapor.bitis;
  if (!buHafta || menu.yemekhane_id !== istek.yemekhane) return;

  if (yeni) rapor.ozet.menu_sayisi += 1;
  if (menu.ogun_id === istek.ogun) {
    rapor.menuler = rapor.menuler
      .filter((mevcut) => mevcut.id !== menu.id)
      .concat(menu)
      .sort((a, b) => a.tarih.localeCompare(b.tarih));
  }
  raporuGoster(rapor, istek);
}

function formGovdesi() {
  const govde = {
    ogrenci_fiyati: ogeler.ogrenciFiyati.value.trim(),
    personel_fiyati: ogeler.personelFiyati.value.trim(),
    yemek_idler: [...form.yemekler],
  };
  if (form.menu) return govde;

  return {
    ...govde,
    yemekhane_id: Number(ogeler.yemekhane.value),
    ogun_id: form.ogun,
    tarih: ogeler.tarih.value,
  };
}

function formHatasi() {
  if (!form.menu && !ogeler.tarih.value) return 'Tarih seçmelisin.';
  if (!ogeler.ogrenciFiyati.value.trim() || !ogeler.personelFiyati.value.trim()) return 'İki fiyatı da girmelisin.';
  if (form.yemekler.size === 0) return 'En az bir yemek seçmelisin.';
  return null;
}

async function menuyuKaydet(olay) {
  olay.preventDefault();
  const hata = formHatasi();
  if (hata) {
    bildirimGoster(ogeler.formBildirim, hata);
    return;
  }

  const yeni = form.menu === null;
  ogeler.kaydet.disabled = true;
  ogeler.kaydet.textContent = 'Kaydediliyor…';

  try {
    const sonuc = yeni
      ? await api('/yonetici/menuler', { method: 'POST', govde: formGovdesi() })
      : await api(`/yonetici/menuler/${form.menu.id}`, { method: 'PUT', govde: formGovdesi() });
    const konum = ogeler.formGovde.scrollTop;
    raporaIsle(sonuc.menu, yeni);
    formuDuzenlemeyeAc(sonuc.menu);
    ogeler.formGovde.scrollTop = konum;
    bildirimGoster(ogeler.formBildirim, sonuc.mesaj, 'basari');
  } catch (istekHatasi) {
    bildirimGoster(ogeler.formBildirim, istekHatasi.message);
  } finally {
    ogeler.kaydet.disabled = false;
    ogeler.kaydet.textContent = 'Kaydet';
  }
}

document.querySelectorAll('[data-hafta]').forEach((dugme) => {
  dugme.addEventListener('click', () => {
    if (!durum.rapor) return;
    secim.tarih = isoTarih(gunEkle(tarihOku(durum.rapor.baslangic), Number(dugme.dataset.hafta) * 7));
    raporuYukle();
  });
});

ogeler.raporYemekhane.addEventListener('change', () => {
  secim.yemekhane = Number(ogeler.raporYemekhane.value);
  raporuYukle();
});

ogeler.raporOgunler.addEventListener('click', (olay) => {
  const dugme = olay.target.closest('[data-ogun]');
  if (!dugme) return;
  secim.ogun = Number(dugme.dataset.ogun);
  raporuYukle();
});

ogeler.formOgunler.addEventListener('click', (olay) => {
  const dugme = olay.target.closest('[data-ogun]');
  if (!dugme || form.menu) return;
  form.ogun = Number(dugme.dataset.ogun);
  ogunSeciminiGoster(ogeler.formOgunler, form.ogun);
  degisiklikDurumunuGoster();
});

ogeler.form.addEventListener('input', degisiklikDurumunuGoster);
ogeler.eskiHal.addEventListener('click', eskiHaleGetir);

ogeler.yemekSecimi.addEventListener('click', (olay) => {
  const cip = olay.target.closest('[data-yemek]');
  if (!cip) return;
  const id = Number(cip.dataset.yemek);
  if (form.yemekler.has(id)) form.yemekler.delete(id);
  else form.yemekler.add(id);
  cipleriGuncelle();
});

document.querySelector('[data-yeni-menu]').addEventListener('click', () => {
  if (durum.rapor) degisikliklerSorulup(() => yeniMenuFormu(varsayilanTarih(), true));
});

document.querySelector('[data-vazgec]').addEventListener('click', () => {
  if (durum.rapor) degisikliklerSorulup(() => yeniMenuFormu());
});

document.querySelector('[data-onay-vazgec]').addEventListener('click', () => {
  bekleyenGecis = null;
  ogeler.onay.close();
});

document.querySelector('[data-onay-at]').addEventListener('click', () => {
  const gecis = bekleyenGecis;
  bekleyenGecis = null;
  ogeler.onay.close();
  gecis?.();
});

ogeler.onay.addEventListener('close', () => {
  bekleyenGecis = null;
});

window.addEventListener('beforeunload', (olay) => {
  if (durum.rapor && degisiklikVar()) olay.preventDefault();
});

ogeler.form.addEventListener('submit', menuyuKaydet);

try {
  const kullanici = await oturumuBaslat();
  if (kullanici && kullanici.rol !== 'yonetici') {
    window.location.replace('/menu.html');
  } else if (kullanici) {
    const [yemekhaneler, ogunler, kategoriler] = await Promise.all([
      api('/yemekhaneler'),
      api('/ogunler'),
      api('/yonetici/yemekler'),
    ]);
    secenekleriDoldur(yemekhaneler, ogunler);
    ciplerOlustur(kategoriler);
    await raporuYukle();
    if (durum.rapor) yeniMenuFormu();
  }
} catch (hata) {
  if (hata.durum !== 401) bildirimGoster(ogeler.bildirim, hata.message);
}
