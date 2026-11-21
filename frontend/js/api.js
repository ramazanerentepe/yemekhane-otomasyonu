const TOKEN_ANAHTARI = 'yemekhane_token';

export const token = {
  al: () => localStorage.getItem(TOKEN_ANAHTARI),
  kaydet: (deger) => localStorage.setItem(TOKEN_ANAHTARI, deger),
  sil: () => localStorage.removeItem(TOKEN_ANAHTARI),
};

export class ApiHatasi extends Error {
  constructor(mesaj, durum) {
    super(mesaj);
    this.name = 'ApiHatasi';
    this.durum = durum;
  }
}

export async function api(yol, { method = 'GET', govde } = {}) {
  const basliklar = { Accept: 'application/json' };
  if (govde !== undefined) basliklar['Content-Type'] = 'application/json';

  const mevcutToken = token.al();
  if (mevcutToken) basliklar.Authorization = `Bearer ${mevcutToken}`;

  let yanit;
  try {
    yanit = await fetch(`/api${yol}`, {
      method,
      headers: basliklar,
      body: govde === undefined ? undefined : JSON.stringify(govde),
    });
  } catch {
    throw new ApiHatasi('Sunucuya ulaşılamadı. Bağlantını kontrol et.', 0);
  }

  const veri = await yanit.json().catch(() => ({}));

  if (yanit.status === 401 && yol !== '/giris') {
    token.sil();
    window.location.replace('/');
  }

  if (!yanit.ok) {
    throw new ApiHatasi(veri.hata ?? 'Beklenmeyen bir hata oluştu.', yanit.status);
  }

  return veri;
}
