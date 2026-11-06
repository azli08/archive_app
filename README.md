# Collectly

Collectly is a personal knowledge management and digital bookmark platform.

## Windows ilk kurulumu

Gerekli araçlar: Docker Desktop, Python 3, Node.js 20.19+ veya 22.12+ ve npm. Kurulum sırasında paketler internetten indirilir; Docker Desktop kurulu ve açık olmalıdır.

1. Depoyu bilgisayarınıza indirin veya klonlayın.
2. Proje ana klasöründeki `Kurulum.bat` dosyasına çift tıklayın. Betik Python sanal ortamını ve paketleri kurar, `backend/.env.example` dosyasını yalnızca `backend/.env` yoksa kopyalar, Docker Compose ile PostgreSQL'i başlatıp hazır olmasını bekler ve Alembic migration'larını uygular.
3. İlk kurulum tamamlandıktan sonra uygulamayı açmak için `Baslat.bat` dosyasına çift tıklayın.

`backend/.env` yerel ayarları içerir ve Git'e eklenmez. Kurulum betiği mevcut bu dosyanın üzerine yazmaz. Örnek dosyadaki yerel geliştirme ayarlarını inceleyin; gerçek veya ortak gizli anahtarları depoya ya da paylaşılan dosyalara koymayın.

`Baslat.bat` PostgreSQL servisini tekrar güvenle kontrol eder, veritabanının hazır olmasını bekler ve API ile Vite zaten çalışıyorsa ikinci bir sunucu başlatmaz. Arayüz `http://localhost:5173`, API dokümanı `http://127.0.0.1:8000/docs` adresindedir.

## Proje yapisi

- `backend/` - FastAPI uygulaması, Python bağımlılıkları, Alembic migration'ları ve Docker Compose veritabanı servisi.
- `frontend/` - React ve Vite arayüzü.
- `docs/` - Proje dokümantasyonu.
- `Kurulum.bat` - Yeni Windows bilgisayardaki ilk kurulum.
- `Baslat.bat` - Gunluk yerel gelistirme baslatma betigi.

Docker Compose, PostgreSQL verisini Docker'ın yönettiği `collectly_postgres_data` isimli volume'da saklar; proje klasörüne veritabanı dosyası yazmaz.
