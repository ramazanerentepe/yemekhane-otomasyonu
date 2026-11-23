# Yemekhane Otomasyonu · Kurulum ve Kullanım

Bu depo, başlangıç paketinin üzerine yazılmış **Web API + arayüz** uygulamasını içerir.
API Node.js 24 + Express 5 ile yazılmıştır ve yalnızca JSON döner; arayüz `frontend`
container'ındaki Apache'nin sunduğu HTML5, CSS3 ve JavaScript sayfalarıdır.

## Gerekenler

- Docker Desktop (Windows/macOS) ya da Docker Engine + Compose v2 (Linux)
- Git
- Boş olması gereken portlar: `8080`, `3307`, `3308`, `6379`

## Kurulum

```bash
git clone https://github.com/ramazanerentepe/yemekhane-otomasyonu.git
cd yemekhane-otomasyonu
docker compose up -d
docker compose ps -a
```

Ek bir adım gerekmez. Şema, örnek veri ve Aşama 4 değişikliği (`db/init/04_degisiklik.sql`)
ilk kurulumda sırayla yüklenir, replika kurulur ve uygulama derlenir. İlk açılış birkaç dakika
sürebilir. Beklenen durum:

| Servis          | Beklenen        |
| --------------- | --------------- |
| `mysql-primary` | `Up (healthy)`  |
| `mysql-replica` | `Up (healthy)`  |
| `redis`         | `Up (healthy)`  |
| `frontend`      | `Up (healthy)`  |
| `uygulama`      | `Up (healthy)`  |
| `replica-setup` | `Exited (0)`    |

Uygulama: <http://localhost:8080>

## Test hesapları

Tüm hesapların şifresi `Yemek2026!` (başlangıç paketinin örnek verisi).

| E-posta                           | Rol      | Not                                  |
| --------------------------------- | -------- | ------------------------------------ |
| `mehmet.yildiz@ogr.kampus.edu.tr` | Öğrenci  | Öğrenci fiyatı                       |
| `zeynep.sahin@ogr.kampus.edu.tr`  | Öğrenci  | Öğrenci fiyatı                       |
| `ayse.demir@ogr.kampus.edu.tr`    | Öğrenci  | Bakiyesi düşük, "Bakiye yetersiz." için |
| `murat.kaya@kampus.edu.tr`        | Personel | Personel fiyatı                      |
| `leyla.arslan@kampus.edu.tr`      | Yönetici | Yönetici paneli                      |

## Ekranlar

Giriş ve çıkış · günün menüsü · haftalık menü ve rezervasyon (tam / yarım porsiyon) ·
rezervasyonlarım · bakiye · değerlendirme · yönetici paneli · profil (alerjen seçimi).

## Aşama etiketleri

| Etiket    | İçerik |
| --------- | ------ |
| `asama-1` | Başlangıç paketinin çalıştırılması, replikasyon doğrulaması |
| `asama-2` | `uygulama` servisi (Web API) ve yedi ekranlı arayüz, okuma/yazma ayrımı |
| `asama-3` | Redis: menü önbelleği (`menu:*`) ve oturumlar (`oturum:*`) |
| `asama-4` | `04_degisiklik.sql`: yarım porsiyon ve alerjen uyarısı, API ve arayüz güncellemesi |

Rapor ve ekran görüntüleri `rapor/` klasöründedir.

## Proje yapısı

```
uygulama/src/
├── config/        # MySQL havuzları (yazma: mysql-primary, okuma: mysql-replica), Redis
├── routes/        # URL ve yöntem eşlemesi, oturum ve yönetici kontrolü
├── controllers/   # girdi doğrulama, yanıt kodu
├── services/      # iş kuralları
└── repositories/  # SQL ve stored procedure çağrıları
frontend/          # HTML sayfaları, css/, js/ (fetch ile API'ye bağlanır)
db/init/           # 01 şema, 02 örnek veri, 04 değişiklik talebi
```

## Sık kullanılan komutlar

```bash
docker compose logs uygulama          # uygulama günlüğü (önbellek okuma ve yazmaları)
docker compose up -d --build uygulama # uygulama kodu değiştiyse yeniden derleme
docker compose down -v                # her şeyi sil (veri dahil)
docker compose up -d                  # verilerle birlikte sıfırdan kur
```

## Sık sorunlar

- **Menü görünmüyor:** Örnek menüler kurulum gününün 7 gün öncesinden 6 gün sonrasına kadar
  üretilir. Bu aralık geçtiyse `docker compose down -v` ve ardından `docker compose up -d`
  ile veriyi bugüne göre yeniden üretin.
- **Port kullanımda:** `8080`, `3307`, `3308` ya da `6379` başka bir program tarafından
  kullanılıyorsa o programı kapatın.
- **Türkçe karakterler bozuk görünüyor:** MySQL istemcisinde `--default-character-set=utf8mb4`,
  Redis'te `redis-cli --raw` kullanın.

Başlangıç paketinin bağlantı bilgileri ve doğrulama komutları için [README.md](README.md).
