# MyCollegePath — Proje raporu (içerik ve teknik altyapı)

Bu belge **MyCollegePath** (paket adı: `mycollegepath`) kod tabanına dayanır: ürünün sunduğu deneyimler, sayfa envanteri ve mimari özet.

---

## 1. Ürün özeti

**MyCollegePath**, üniversite başvurusu sürecinde öğrencilere yönelik bir web uygulamasıdır. Arayüz ve pazarlama metinleri **İngilizce**dir.

**Temel vaatler (landing, pricing ve uygulama akışından):**

- Kişiselleştirilmiş **üniversite eşleştirme** (profil, onboarding ve tercihlere göre).
- **AI danışman** (sohbet) ile başvuru ve okul seçimi konusunda rehberlik.
- **Yol haritası (roadmap)** üretimi ve takibi.
- **AI Score** ile profil gücünün sayısal/özet değerlendirmesi ve liderlik tablosu.
- **Deneme (essay)** metinleri için AI analizi.
- Okul verileri üzerinden **arama, detay, favoriler** ve (API ile) **“neden uygun”** açıklamaları.
- **Apply Now** kısa listesi ve başvuru adımları takibi (durum alanları).
- **Insights** ile eşleştirme/yol haritası geçmişi ve özet metrikler.
- **Belgeler** üzerinden PDF metin çıkarımı ve eşleştirme akışına bağlantı.

Öğrenci odaklıdır; **Mentor** ve **Kurum** giriş sayfaları şu an “coming soon” placeholder’dır.

---

## 2. Teknoloji yığını

| Katman | Seçim |
|--------|--------|
| Framework | **Next.js 14** (App Router) |
| Dil | **TypeScript** |
| UI | **React 18**, **Tailwind CSS 3**, **tailwindcss-animate** |
| Bileşenler | **Radix UI** (dialog, dropdown, tabs, toast, vb.), **class-variance-authority**, **clsx**, **tailwind-merge** |
| Animasyon | **Framer Motion** (seçili ekranlarda) |
| Kimlik doğrulama & veri | **Firebase** (client SDK + **firebase-admin** sunucuda) |
| Yapay zeka | **OpenAI** (`openai` npm paketi — sohbet, roadmap, essay analizi, eşleştirme ağırlıkları, skor kartı metinleri vb.) |
| Doğrulama | **Zod** |
| PDF | **pdfjs-dist** (metin çıkarımı), **html2canvas** + **jspdf** (dışa aktarım senaryoları) |
| Test | **Jest**, **Testing Library** |

**Çalıştırma:** `npm run dev` / `npm run build` / `npm start` / `npm test`.

---

## 3. Mimari özeti

### 3.1 Rotalar ve erişim

- **`/app/*`**: Giriş yapmış öğrenci alanı. **`middleware.ts`** `firebase-id-token` çerezi yoksa `/login?from=...` ile yönlendirir. Eşleştirici, `/_next`, `api` ve statik dosyalar hariç tutulur (geniş matcher; yorumda CSS/JS bozulmasını önleme notu var).
- **`app/app/layout.tsx`**: Sunucu tarafında oturum (`getSessionUserFromCookies`) ve **`onboardingCompleted`** kontrolü. Tamamlanmamışsa **`/onboarding/step-1`**. Başarılı ise **`AppShell`** (kenar çubuğu + üst çubuk).
- **`(public)`** grubu: Landing, login, onboarding, pricing, honoring vb. — layout minimal.

### 3.2 Oturum modeli

- İstemci: Firebase Auth (Google / e-posta).
- Sunucu: **`POST /api/auth/session`** ile ID token doğrulanır, **`httpOnly`** çerez (`firebase-id-token`) set edilir. **`DELETE`** ile temizlenir. **`GET`** isteğe bağlı Bearer token ile kullanıcı bilgisi.

### 3.3 Sunucu bileşenleri vs istemci

- Birçok **`app/app/*/page.tsx`** dosyası sunucuda veri çeker (ör. dashboard’ta `getDashboardUserData`), sonuçları **client** içerik bileşenlerine prop olarak verir.
- Onboarding adımları, sohbet, eşleştirme UI’si gibi etkileşim ağırlıklı sayfalar **`"use client"`**.

---

## 4. Veri ve entegrasyonlar

### 4.1 Firebase (Firestore)

Öğrenci tarafında kullanılan başlıca yapılar (koddan):

| Koleksiyon / yol | Rol |
|------------------|-----|
| **`users/{uid}`** | `onboardingAnswers`, `onboardingCompleted`, `onboardingCompletedAt`, `onboarding` meta, `updatedAt` |
| **`users/{uid}/matches/{runId}`** | Eşleştirme çalıştırma sonuçları |
| **`users/{uid}/roadmaps/{roadmapId}`** | Üretilen yol haritaları; tamamlanan görev id’leri |
| **`users/{uid}/applyNow/{runId}`** | Apply Now kısa listesi ve kalemlerin durumu |
| **`users/{uid}/favorites`** | Favori okullar (chat bağlamı ve sunucu yardımcıları) |
| **`studentProfiles/{uid}`** | Özet profil: GPA, SAT/ACT, tercihler, foto URL, zaman damgaları |
| **`savedColleges`** | Kayıtlı okullar (`userId`, `collegeId`, `name`, `savedAt`) |
| **`aiScores/{uid}`** | AI Score sonuçları (skor, özet, güçlü yönler, iyileştirmeler) |
| **Alt koleksiyonlar (client `firestore.ts`)** | `essays`, `collegeNotes`, `chatSessions` (kullanıcıya bağlı içerik) |

**Firebase Storage:** Profil fotoğrafı yükleme (`uploadProfilePhoto`) — onboarding tamamlanınca.

**Admin SDK:** `FIREBASE_ADMIN_*`, `FIREBASE_SERVICE_ACCOUNT_JSON` veya kök dizinde servis hesabı dosyası ile yapılandırma (bkz. `lib/firebase/admin.ts`).

### 4.2 College Scorecard API

- **`lib/scorecard/client.ts`**: ABD **College Scorecard** (`api.data.gov/ed/collegescorecard/v1/schools`).
- **Gerekli ortam değişkeni:** `SCORECARD_API_KEY` veya `COLLEGE_SCORECARD_API_KEY`.
- Okul arama, id ile detay, alan seçimi; hata ve **429** için yeniden deneme / `RateLimitError`.

### 4.3 OpenAI

- Sohbet (`/api/chat`), roadmap üretimi, essay analizi, eşleştirme ağırlık önerileri, skor kartı / “why fit” gibi uçlar domain katmanında `lib/ai` ve `lib/domain` altında kullanılır.
- API route’larda **kullanıcı başına rate limit** (ör. chat 20/dk, roadmap 10/dk) — `lib/rateLimit/server.ts`.

---

## 5. Sayfa envanteri

### 5.1 Herkese açık (`(public)`)

| Rota | İşlev |
|------|--------|
| **`/`** | Landing: ürün tanıtımı, özellikler, fiyatlandırma özeti, CTA → onboarding |
| **`/pricing`** | Planlar (Free, Starter, Pro vb.), geleneksel danışmanlık vs AI karşılaştırması; canlı sayaçlar için `getPublicMarketingMetrics` |
| **`/honoring`** | Askeri, ilk müdahale, koruyucu aile vb. gruplara yönelik indirim / güven mesajları |
| **`/login`** | Öğrenci girişi (e-posta + Google); oturum çerezi; `from` ile `/app` geri dönüş |
| **`/login/advisor`** | Mentor girişi — yakında |
| **`/login/institution`** | Kurum girişi — yakında |
| **`/onboarding/step-1` … `step-7`** | Çok adımlı onboarding; taslak `localStorage`, son adımda hesap + Firestore’a yazım. `?from=profile` ile profilden düzenleme |
| **`/onboarding/layout`** | İlerleme çubuğu, gizlilik şeridi, yan bilgi kartları |

### 5.2 Öğrenci uygulaması (`/app/*`)

Kenar çubuğundaki ana nav (`AppShell`): Dashboard, College List, AI Consultant, Essays, College Matching, Apply Now, My Roadmap, My AI Score, Insights, Profile.

| Rota | İşlev |
|------|--------|
| **`/app/dashboard`** | Başvuru hazırlığı özeti, sağlık metrikleri, AI ipucu, AI Score liderlik tablosu önizlemesi |
| **`/app/colleges`** | Scorecard ile arama; favorilere ekleme; kayıtlı okullar |
| **`/app/colleges/[id]`** | Tek okul detayı; zenginleştirme / görsel API’leri ile desteklenebilir |
| **`/app/chat`** | AI danışman sohbeti; profil, favoriler ve son eşleştirme bağlamı |
| **`/app/essays`** | Deneme metinleri; AI analiz |
| **`/app/documents`** | PDF yükleme / metin çıkarımı; College Matching’e yönlendirme; ayarlar linki |
| **`/app/matching`** | Eşleştirme çalıştırma ve sonuçlar (sunucu motoru + geçmiş) |
| **`/app/apply-now`** | Son eşleştirmeden kısa liste; okul başına durum |
| **`/app/myroad`** | Roadmap oluşturma, fazlar ve görevler; tamamlama senkronu |
| **`/app/ai-score`** | Profil + onboarding’e göre skor hesaplama; liderlik tablosu |
| **`/app/insights`** | Eşleştirme ve roadmap geçmişi / özet istatistikler |
| **`/app/profile`** | Profil ve onboarding özeti; düzenleme onboarding’e bağlanabilir |
| **`/app/settings`** | Şu an **`/app/profile`** adresine yönlendirir |
| **`/app/deadlines`** | Placeholder: “liste boş”; college list’e yönlendirme — gerçek deadline verisi yok |

---

## 6. API uçları (`app/api`)

| Yol | Amaç |
|-----|------|
| **`/api/auth/session`** | Oturum çerezi (POST/DELETE/GET) |
| **`/api/chat`** | Sohbet tamamlama; oturum + rate limit |
| **`/api/chat/context`** | Sohbet bağlamı yardımcıları |
| **`/api/matching/run`** | Eşleştirme motorunu çalıştırma, sonucu Firestore’a yazma |
| **`/api/matching/history`** | Geçmiş koşular |
| **`/api/roadmap/generate`** | Onboarding’den roadmap üretimi, kayıt |
| **`/api/roadmap/tasks`** | Görev güncellemeleri |
| **`/api/roadmap/history`** | Geçmiş roadmap’ler |
| **`/api/ai-score/calculate`** | AI skoru hesaplama ve kayıt |
| **`/api/ai-score/leaderboard`** | Skor tablosu |
| **`/api/essays/analyze`** | Deneme analizi |
| **`/api/apply-now`** | Apply Now kısa liste kaydı / okuma |
| **`/api/scorecard/search`** | Okul arama (proxy / sunucu tarafı) |
| **`/api/scorecard/college`** | Id ile okul |
| **`/api/college/enrich`**, **`/api/college/why-fit`**, **`/api/college/image`** | Okul kartı zenginleştirme, uygunluk metni, görsel |

İsteklerde **`lib/validation/api`** şemaları ve **`lib/errors/api`** ile tutarlı hata kodları kullanılır; kritik uçlarda **`logApiError`**.

---

## 7. İş mantığı modülleri (`lib`)

| Alan | Dosya / klasör | Not |
|------|----------------|-----|
| Eşleştirme | `lib/matching/engine.ts`, `types.ts` | Scorecard aday havuzu, skorlama, isteğe bağlı OpenAI ağırlıkları |
| Roadmap | `lib/roadmap/engine.ts`, `types.ts`, `domain/roadmap` | Metin/structured çıktı |
| Sohbet | `lib/domain/chat`, `lib/ai/admissionsChat.ts` | Bağlam birleştirme, mention çözümü |
| Skor kartı | `lib/scorecard/*` | API istemcisi, önbellek, tipler |
| Onboarding | `lib/onboarding/schema.ts`, `storage.ts`, `stepConfig.ts` | Geniş cevap şeması, localStorage + Firestore |
| Dashboard | `lib/dashboard/getDashboardData.ts` | Sunucu tarafı agregasyon |
| Profil gücü | `lib/profile/profileStrength.ts` | Göstergeler |
| Domain katmanı | `lib/domain/*` | college, chat, matching, profile, roadmap için tek giriş yüzeyi |

---

## 8. Bileşen yapısı (özet)

- **`components/layout`**: `AppShell`, `PublicHeader`
- **`components/dashboard`**, **`components/colleges`**, **`components/chat`**, **`components/matching`**, **`components/roadmap`**, **`components/essays`**, **`components/profile`**, **`components/apply-now`**, **`components/insights`**, **`components/onboarding`**
- **`components/ui`**: Buton, input, toast, progress, kartlar
- **`components/Providers.tsx`**: Toast + ErrorBoundary
- Kök **`layout.tsx`**: Inter fontu, global CSS, metadata

---

## 9. Test ve kalite

- **Jest** + **@testing-library/react**; örnek: `lib/errors/api.test.ts`, `lib/utils.test.ts`
- **ESLint** (`eslint-config-next`)

---

## 10. Ortam değişkenleri (koddan çıkan liste)

Üretimde tipik olarak gerekli / kullanılanlar:

- **Firebase client**: proje yapılandırması (`lib/firebase/client.ts` içinde env isimleri)
- **Firebase Admin**: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` veya `FIREBASE_SERVICE_ACCOUNT_JSON` / dosya yolu
- **College Scorecard**: `SCORECARD_API_KEY` veya `COLLEGE_SCORECARD_API_KEY`
- **OpenAI**: API anahtarı (ilgili `lib/ai/openai.ts` veya process.env kullanımı)

Eksik anahtarlar ilgili özellikleri çalışma zamanında devre dışı bırakır veya hata döndürür.

---

## 11. Bilinen sınırlamalar ve “yakında” maddeler

- **`/app/settings`**: Doğrudan profile yönlendiriyor; ayrı bir ayarlar ekranı yok.
- **`/app/deadlines`**: Metin placeholder; gerçek deadline takvimi entegrasyonu yok.
- **`/login/advisor`**, **`/login/institution`**: Placeholder.
- Onboarding sırasında bazı sınav türleri (ör. SAT Subject, Cambridge) listede seçilebilir; Step 4’te özel skor alanları tanımlı olmayabilir (bkz. onboarding raporu).
- `primary-*` Tailwind tonları yapılandırmada kısıtlı; bazı JSX sınıfları tam palet olmadan kullanılıyor olabilir (tasarım dokümanına bakınız).

---

## 12. İlgili dahili dokümanlar

- `docs/LANDING_PAGE_DESIGN_SPEC.md` — Landing tasarım token’ları
- `docs/ONBOARDING_QUESTIONS_REPORT.md` — Onboarding soru/envanter listesi

---

*Bu rapor, depo içi kaynak dosyalarının taranmasıyla oluşturulmuştur; dış hizmet sözleşmeleri veya altyapı (hosting, domain) bu belgenin kapsamı dışındadır.*
