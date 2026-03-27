# MyCollegePath Sistem Analiz Raporu

**Tarih:** Şubat 2025  
**Kapsam:** Genel sistem tanımı, teknik özellikler, eksiklikler, hatalar, riskler, lansman öncesi gereksinimler ve iyileştirme önerileri.

---

## 1. Genel Sistem Tanımı

**MyCollegePath**, lise öğrencilerinin üniversite başvuru sürecini yönetmelerine yardımcı olan bir **EdTech web uygulamasıdır**. Öğrenciler:

- **Onboarding** ile kişisel bilgi, akademik veriler (GPA, SAT/ACT), hedefler ve tercihleri girer.
- **College Scorecard** verisi ile kolej arayıp listelerine ekleyebilir.
- **AI tabanlı eşleştirme** ile profillerine uygun okullar önerilir.
- **Chat** ile “admissions coach” tarzında metin tabanlı rehberlik alır.
- **Profil** ve **Ayarlar** ile verilerini görüntüleyip günceller.

Ürün şu an **ücretsiz**; ödeme/abonelik entegrasyonu yok. Landing, Pricing ve Discount sayfaları bilgilendirme ve CTA amaçlıdır.

---

## 2. Teknik Özellikler

### 2.1 Teknoloji Yığını

| Katman | Teknoloji |
|--------|------------|
| Framework | Next.js 14 (App Router) |
| Dil | TypeScript |
| Styling | Tailwind CSS, tailwindcss-animate, shadcn/ui (Radix tabanlı), lucide-react |
| Auth | Firebase Authentication (Email/Password, Google) |
| Veritabanı | Cloud Firestore |
| Depolama | Firebase Storage (profil fotoğrafı) |
| Harici API’ler | College Scorecard (data.gov), OpenAI (GPT-4o-mini) |

### 2.2 Uygulama Yapısı

- **Public:** `/`, `/login`, `/pricing`, `/#discounts`, `/onboarding/step-1` … `step-6`
- **Korumalı (session gerekli):** `/app/dashboard`, `/app/profile`, `/app/colleges`, `/app/colleges/[id]`, `/app/documents` (matching), `/app/chat`, `/app/settings`, `/app/deadlines`
- **Middleware:** Sadece `/app/*` rotalarında cookie ile `firebase-id-token` kontrolü; yoksa `/login?from=...` yönlendirmesi.

### 2.3 Oturum ve Yetkilendirme

- **Session:** Firebase ID token, `POST /api/auth/session` ile doğrulanıp `firebase-id-token` httpOnly cookie’ye yazılıyor.
- **Sunucu tarafı:** `getSessionUserFromCookies()` / `getSessionUserFromRequest()` ile token doğrulanıyor; app layout’ta oturum yoksa `/login`, onboarding tamamlanmamışsa `/onboarding/step-1`’e yönlendirme.

### 2.4 Veri Modeli (Firestore)

| Koleksiyon / Yol | Açıklama |
|-------------------|----------|
| `users/{uid}` | Onboarding cevapları, `onboardingCompleted` flag |
| `users/{uid}/favorites/{collegeId}` | Favori kolej (collegeId, name, createdAt) |
| `users/{uid}/matches/{runId}` | Eşleştirme çıktısı (sunucu yazar, istemci okur) |
| `users/{uid}/collegeNotes/{collegeId}` | Kolej notları (istemci okur/yazar) |
| `studentProfiles/{uid}` | GPA, test skorları, tercihler, profil foto URL |
| `savedColleges/{userId_collegeId}` | Kaydedilen kolej listesi |
| `colleges/{id}` | Scorecard önbelleği (sadece sunucu, 7 gün TTL) |

### 2.5 API Özeti

| Endpoint | Amaç |
|----------|------|
| `GET/POST/DELETE /api/auth/session` | Oturum bilgisi / token ile giriş / çıkış |
| `GET /api/scorecard/search` | College Scorecard arama proxy |
| `GET /api/scorecard/college?id=` | Kolej detayı (Firestore + bellek önbelleği, yoksa Scorecard) |
| `POST /api/college/enrich` | Eksik alanlar için OpenAI ile kısa notlar |
| `POST /api/college/why-fit` | Profil–kolej uyumu için “why fit” metni (OpenAI) |
| `POST /api/matching/run` | Eşleştirme çalıştırma, `users/{uid}/matches`’e yazma |
| `POST /api/chat` | Admissions coach sohbeti (OpenAI, profil + favoriler + son match context) |
| `GET /api/chat/context` | Sohbet için profil, favoriler, son match run |

### 2.6 Ortam Değişkenleri (İsimler)

- **Client:** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
- **Server:** `OPENAI_API_KEY`, `COLLEGE_SCORECARD_API_KEY` (veya `SCORECARD_API_KEY`), Firebase Admin için `FIREBASE_SERVICE_ACCOUNT_JSON` veya ayrı alanlar (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`) / servis hesabı dosyası.

---

## 3. Tespit Edilen Eksiklikler

### 3.1 Firestore Kuralları

- **`users/{userId}/collegeNotes/{docId}`** için kural **yok**. İstemci `getCollegeNote` / `setCollegeNote` kullandığında Firestore “permission denied” dönebilir. Kolej notu özelliği kullanılıyorsa bu alt koleksiyon için `request.auth.uid == userId` ile read/write kuralı eklenmeli.

### 3.2 Validasyon

- **Zod (veya benzeri) kullanılmıyor.** API istek gövdesi ve query parametreleri manuel kontrol ediliyor; hatalı veya beklenmeyen tipler runtime hatalarına yol açabilir.
- Onboarding draft’ı `lib/onboarding/storage.ts` içinde `sanitizeDraft` ile allowlist ve basit tip filtreleriyle temizleniyor; schema tabanlı doğrulama yok.

### 3.3 Hata Yönetimi

- **React Error Boundary** yok. Bir bileşende yakalanmamış hata tüm sayfayı/uygulamayı düşürebilir.
- API’lerde try/catch ile 400/401/404/500 ve mesaj dönülüyor; ancak istemci tarafında ortak bir hata gösterim stratejisi (ör. toast, inline mesaj) tutarlı değil.
- **Radix Toast** kurulu ama merkezi “action feedback” (kaydet, sil, favori ekle vb.) için tek bir kullanım standardı tanımlı değil.

### 3.4 TypeScript Uyumsuzlukları

- Geçmiş derlemelerde görülen tipler: `lib/onboarding/storage.ts` (WorkInclinationItem, InterestCategory, ActivityWithIntensity vb.), `lib/onboarding/schema.ts` ile tam uyumlu değil; `lib/ai/orchestrator.ts` içinde `runMatching` iki argümanla çağrılıyor ama engine tek argüman alıyor (orchestrator şu an kullanılmıyor).
- `getDashboardUserData` dönüş tipi `OnboardingAnswers` için bazen `lib/onboarding/types` ile `schema` arasında fark olabiliyor; tek tip kaynağı kullanılmalı.

### 3.5 Dokümantasyon ve Gizlilik

- **.env.local** içinde gerçek API anahtarları ve Firebase bilgileri var. Bu dosya asla commit edilmemeli; `.env.example` (değerler olmadan) ile örnek tanımlar verilmeli.
- API rate limit, timeout ve retry politikaları dokümante değil; College Scorecard ve OpenAI kotaları aşılırsa davranış belirsiz.

---

## 4. Bilinen Hatalar ve Riskler

### 4.1 Mevcut Hatalar

1. **College Notes:** Firestore’da `collegeNotes` için kural olmadığı için istemci yazma/okuma başarısız olabilir.
2. **Scorecard 500:** Loglarda `GET /api/scorecard/college?id=...` için zaman zaman 500 görülüyor; ağ/timeout veya API yanıt formatı kaynaklı olabilir, retry veya daha sağlam hata mesajı gerekir.
3. **Punycode deprecation:** Node uyarısı (`punycode` modülü); genelde bir bağımlılıktan gelir, güncelleme veya userland alternatifi ile giderilebilir.

### 4.2 İleride Oluşabilecek Hatalar

1. **Rate limit / kota:** College Scorecard ve OpenAI için limit aşımında 429 veya benzeri; uygulama bunu yakalayıp kullanıcıya anlamlı mesaj göstermiyor.
2. **Token süresi:** Firebase ID token süresi dolunca middleware veya API 401 dönebilir; istemci tarafında token yenileme ve sayfa yenileme/redirect akışı netleştirilmeli.
3. **Büyük onboarding payload:** Onboarding cevapları tek `users/{uid}` dökümanına yazılıyor; çok büyürse okuma/yazma maliyeti ve boyut sınırı (1 MB) riski.
4. **Eşzamanlı yazma:** Aynı kullanıcı birden fazla sekmede profil/onboarding güncellerse çakışma; optimistic update veya transaction kullanılmıyor.
5. **OpenAI kesintisi:** API key geçersiz veya servis kesintisinde chat ve enrich/why-fit tamamen durabilir; fallback metinleri ve hata mesajları net olmalı.

---

## 5. Kullanıcılara Açmadan Önce Yapılması Gerekenler

### 5.1 Zorunlu

1. **Firestore:** `users/{userId}/collegeNotes/{docId}` için read/write kuralı ekleyin veya bu özelliği kullanmıyorsanız koddan kaldırın.
2. **Gizlilik:** `.env.local` (ve tüm gerçek secret’lar) repo dışında tutulmalı; production için ayrı env (Vercel/env vb.) kullanın; `.env.example` ekleyin.
3. **Hata sınırları:** En azından ana sayfalar ve API route’lar için try/catch + anlamlı HTTP status ve mesaj; kritik sayfalarda React Error Boundary ile kullanıcıya “Bir şeyler yanlış gitti” ekranı.
4. **Validasyon:** Kritik API’lerde (auth, matching, chat, college save/favorite) istek gövdesi ve gerekli parametreler için Zod (veya benzer) ile şema doğrulaması.
5. **Onboarding tamamlanma:** `onboardingCompleted` flag’inin step-6 sonunda güvenilir şekilde set edildiğini ve app layout’un buna göre yönlendirdiğini doğrulayın.

### 5.2 Önerilen

1. **Rate limit:** En azından `/api/chat` ve `/api/matching/run` için IP veya kullanıcı bazlı basit rate limit (örn. Vercel veya middleware ile).
2. **Loglama:** Production’da API hatalarını (stack olmadan, PII olmadan) loglayın; Scorecard 500 ve OpenAI hatalarını izleyin.
3. **Health check:** `/api/health` gibi bir uç nokta ile Firebase, Scorecard ve isteğe bağlı OpenAI erişimini periyodik kontrol.
4. **Deadlines sayfası:** `/app/deadlines` şu an var; gerçek deadline verisi nereden gelecek (saved colleges + harici takvim mi?) netleştirilip implemente edilmeli veya “Coming soon” ile gizlenmeli.

---

## 6. Geliştirilmesi Gereken Taraflar

### 6.1 Mimari ve Veri

- **Onboarding / profil çakışması:** Hem `users/{uid}.onboardingAnswers` hem `studentProfiles/{uid}` kullanılıyor; tek kaynak veya senkronizasyon kuralı yazılmalı, aksi halde tutarsız veri kalır.
- **Chat geçmişi:** Sohbet kalıcı değil; `chatSessions` koleksiyonu kodda tanımlı ama kullanılmıyor. Geçmiş istiyorsanız mesajları saklayıp UI’da göstermek gerekir.
- **Matching sonuçları:** Sadece son run gösteriliyor gibi; geçmiş run’lar listelenip karşılaştırma isteğe bağlı eklenebilir.

### 6.2 Güvenlik

- **Input sanitization:** Chat ve not alanlarına XSS için escape/DOMPurify; rich text kullanıyorsanız güvenli bir parser.
- **CORS / API erişimi:** API route’ların yalnızca kendi domain’inizden (ve gerekirse belirli origin’lerden) çağrıldığından emin olun.
- **Firebase Admin:** Servis hesabı anahtarı sadece sunucu tarafında ve env’den okunmalı; asla client bundle’a girmemeli (şu an böyle kullanılıyor, kontrol edilmeli).

### 6.3 Kullanıcı Deneyimi

- **Yükleme durumları:** Arama, matching, chat ve kolej detayında tutarlı skeleton/loading; boş liste için ortak EmptyState kullanımı.
- **Erişilebilirlik:** Form alanlarında label, hata mesajları ve focus yönetimi; klavye ile gezinme ve ekran okuyucu uyumu.
- **Mobil:** Sidebar ve formların küçük ekranda test edilmesi; onboarding adımlarının mobilde rahat doldurulması.

### 6.4 Operasyon ve Bakım

- **Test:** Unit test (lib, matching, auth helpers) ve kritik akışlar için birkaç E2E test (login, onboarding, save college, run matching) eklenmesi.
- **Monitoring:** Production’da hata takibi (örn. Sentry) ve basit metrikler (API süreleri, 4xx/5xx oranları).
- **Versiyon ve changelog:** Bağımlılık sürümleri ve breaking değişiklikler için not; Next.js 15 ve React 19 geçişi planlanıyorsa ayrı bir geçiş planı.

---

## 7. Bilinen Uyarılar

- **Punycode deprecation:** Node.js konsolunda `punycode` modülü ile ilgili uyarı görülebilir; genelde bir bağımlılıktan (örn. Firebase/Next.js) gelir. Node’u güncellemek veya ilgili paketi güncellemek uyarıyı giderebilir; uygulama işlevselliğini etkilemez.

---

## 8. Özet Tablo

| Kategori | Durum | Öncelik |
|----------|--------|---------|
| Firestore collegeNotes kuralı | Eklendi | — |
| Gizlilik (env, .env.example) | İyileştirilmeli | Yüksek |
| API/Form validasyonu (Zod) | Eklendi | — |
| Error Boundary + Toast | Eklendi | — |
| Rate limit (429) mesajları | Eklendi (Scorecard, OpenAI) | — |
| Token süresi / 401 yenileme | fetchWithAuth ile giderildi | — |
| Chat geçmişi kalıcılığı | Yok | Orta |
| TypeScript/schema uyumu | Düzeltildi | — |
| Test (unit/E2E) | Yok | Orta |
| Monitoring / logging | Minimal | Düşük |
| Deadlines veri kaynağı | Belirsiz | Düşük |

---

Bu rapor, mevcut kod tabanı ve yapılan incelemelere dayalı bir özettir. Canlıya almadan önce güvenlik ve veri akışının uzman gözüyle bir kez daha gözden geçirilmesi önerilir.
