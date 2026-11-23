import { api } from '../api.js';
import { bakiyeyiGoster, oturumuBaslat, rolAdi } from '../oturum.js';
import { basHarfler, bildirimGizle, bildirimGoster, paraBicimle } from '../yardimcilar.js';

const durum = { alerjenler: [], kayitli: new Set(), secili: new Set() };

const ogeler = {
  bildirim: document.querySelector('#sayfa-bildirim'),
  form: document.querySelector('[data-alerjen-formu]'),
  alerjenler: document.querySelector('[data-alerjenler]'),
  sayac: document.querySelector('[data-alerjen-sayac]'),
  kaydet: document.querySelector('[data-kaydet]'),
  formBildirim: document.querySelector('[data-alerjen-bildirim]'),
  sablon: document.querySelector('#alerjen-sablonu'),
};

const yaz = (secici, metin) => { document.querySelector(secici).textContent = metin; };

function kullaniciyiGoster(kullanici) {
  yaz('[data-profil-avatar]', basHarfler(kullanici.ad, kullanici.soyad));
  yaz('[data-profil-ad]', `${kullanici.ad} ${kullanici.soyad}`);
  yaz('[data-profil-rol]', rolAdi(kullanici.rol));
  yaz('[data-profil-eposta]', kullanici.eposta);
  yaz('[data-profil-bakiye]', paraBicimle(kullanici.bakiye));
  document.querySelector('[data-profil-ogrenci-no-satiri]').hidden = !kullanici.ogrenci_no;
  yaz('[data-profil-ogrenci-no]', kullanici.ogrenci_no ?? '');
}

const ayniMi = (a, b) => a.size === b.size && [...a].every((id) => b.has(id));

function durumuGoster() {
  ogeler.alerjenler.querySelectorAll('[data-alerjen]').forEach((cip) => {
    const secili = durum.secili.has(Number(cip.dataset.alerjen));
    cip.setAttribute('aria-pressed', String(secili));
    cip.querySelector('[data-simge]').setAttribute('href', `/img/ikonlar.svg#${secili ? 'onay' : 'arti'}`);
  });

  const sayi = durum.secili.size;
  ogeler.sayac.textContent = sayi > 0 ? `${sayi} alerjen seçili` : 'Alerjen seçmedin';
  ogeler.kaydet.disabled = ayniMi(durum.secili, durum.kayitli);
}

function alerjenleriYukle(alerjenler) {
  durum.alerjenler = alerjenler;
  durum.kayitli = new Set(alerjenler.filter((alerjen) => alerjen.secili).map((alerjen) => alerjen.id));
  durum.secili = new Set(durum.kayitli);
}

function alerjenleriCiz() {
  ogeler.alerjenler.replaceChildren(...durum.alerjenler.map((alerjen) => {
    const cip = ogeler.sablon.content.firstElementChild.cloneNode(true);
    cip.dataset.alerjen = alerjen.id;
    cip.querySelector('[data-ad]').textContent = alerjen.ad;
    return cip;
  }));
  durumuGoster();
}

async function kaydet(olay) {
  olay.preventDefault();
  ogeler.kaydet.disabled = true;
  ogeler.kaydet.textContent = 'Kaydediliyor';
  bildirimGizle(ogeler.formBildirim);

  try {
    const sonuc = await api('/profil/alerjenler', { method: 'PUT', govde: { alerjen_idler: [...durum.secili] } });
    alerjenleriYukle(sonuc.alerjenler);
    bildirimGoster(ogeler.formBildirim, sonuc.mesaj, 'basari');
  } catch (hata) {
    bildirimGoster(ogeler.formBildirim, hata.message);
  } finally {
    ogeler.kaydet.textContent = 'Kaydet';
    durumuGoster();
  }
}

ogeler.alerjenler.addEventListener('click', (olay) => {
  const cip = olay.target.closest('[data-alerjen]');
  if (!cip) return;
  const id = Number(cip.dataset.alerjen);
  if (durum.secili.has(id)) durum.secili.delete(id);
  else durum.secili.add(id);
  bildirimGizle(ogeler.formBildirim);
  durumuGoster();
});

ogeler.form.addEventListener('submit', kaydet);

try {
  if (await oturumuBaslat()) {
    const profil = await api('/profil');
    kullaniciyiGoster(profil.kullanici);
    bakiyeyiGoster(profil.kullanici.bakiye);
    alerjenleriYukle(profil.alerjenler);
    alerjenleriCiz();
  }
} catch (hata) {
  if (hata.durum !== 401) bildirimGoster(ogeler.bildirim, hata.message);
}
