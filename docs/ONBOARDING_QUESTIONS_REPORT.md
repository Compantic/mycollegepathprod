# Onboarding — kullanıcıya sorulan tüm alanlar ve seçenekler

Bu rapor, uygulamadaki onboarding akışında (`/onboarding/step-1` … `step-7`) kullanıcıya gösterilen soruları, zorunluluk durumunu ve sabit seçenekleri kodla uyumlu şekilde listeler.

**Kaynak:** `app/(public)/onboarding/step-*.tsx`, `lib/onboarding/stepConfig.ts`

**Not:** Metinler arayüzde İngilizce olduğu için soru ifadeleri aynen İngilizce bırakılmıştır.

---

## Akış özeti (7 adım)

| Adım | Başlık | Açıklama (config) |
|------|--------|-------------------|
| 1 | Tell us about yourself | Getting started with your basic info |
| 2 | Character & learning profile | How you learn and what drives you |
| 3 | Career & academics | Your goals and academic interests |
| 4 | Tests & credits | Exams, tutoring, and college credits |
| 5 | Activities & achievements | What you do outside the classroom |
| 6 | Review your profile | Confirm your answers *(+ ek tercih soruları ve özet)* |
| 7 | Create your account | Sign up with Google or email to save your profile |

---

## Step 1 — Tell us about yourself

### Profil fotoğrafı

| Alan | Tür | Zorunlu | Not |
|------|-----|---------|-----|
| Profil fotoğrafı | Dosya yükleme (`image/*`) | Hayır | “Upload a profile photo”, “Select File” |

### Kişisel bilgiler

| Soru / alan | Tür | Zorunlu | Seçenekler veya format |
|-------------|-----|---------|-------------------------|
| First name | Metin | Evet | Placeholder: e.g. John |
| Last name | Metin | Evet | Placeholder: e.g. Doe |
| Date of birth | Tarih (`type="date"`) | Evet | Açıklama: Format: mm/dd/yyyy; yaş otomatik gösterilir |
| Gender | Tek seçim (pill / radio) | Evet | **Male**, **Female**, **Non-binary**, **Prefer not to say**, **Other** — Other seçilirse opsiyonel “Specify (optional)” metin alanı |
| Where do you live? | Ülke + koşullu eyalet + şehir | Ülke: evet mantığı; ABD’de eyalet zorunlu | **Country (select):** United States, Canada, United Kingdom, Other — **State (ABD):** tüm ABD eyaletleri + DC (kodda `US_STATES`: AL … WY, DC) — **City:** opsiyonel metin |
| Current high school | Metin | Hayır | Placeholder: Start typing your school name… + “Can’t find your school? Add it manually” linki |
| Expected graduation year | Select | Evet | **2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033** |

### Life outlook

| Soru / alan | Tür | Zorunlu | Seçenekler veya format |
|-------------|-----|---------|-------------------------|
| What is your current grade level? | Select | Evet | **Grade 9**, **Grade 10**, **Grade 11**, **Grade 12**, **Gap Year**, **Other** |
| How would you rate your life satisfaction? | Slider 1–10 | Evet | 1 = low, 10 = high |
| If you had all the opportunities without limitations, what would you add to your life? | Uzun metin | Hayır | — |
| What is one thing you want to eliminate from your life that would release the most burden or difficulty? | Uzun metin | Hayır | — |
| Do you believe academic success is crucial for your happiness and life success? | Tek seçim (pill) | Evet | **Yes**, **No**, **Not sure** |
| What are you naturally good at? | Uzun metin | Hayır | — |
| What is your favorite class? | Kısa metin | Hayır | — |

**Navigasyon:** “Skip for now” (zorunlu alanları atlamadan ilerlemez; taslak kaydı için Next gerekir) — profilden `?from=profile` ile gelindiğinde akış profilde biter.

---

## Step 2 — Character & learning profile

| Soru / alan | Tür | Zorunlu | Seçenekler |
|-------------|-----|---------|------------|
| Rank in order: Ideas, Data, People, Things (1 = most inclined) | Dört adet select (1.–4.; tekrarsız) | Evet | Her sırada: **Ideas**, **Data**, **People**, **Things** (önceki seçimlere göre kalanlar filtrelenir) |
| 9a) Structured vs. Open-ended? | Üç kart (tek seçim) | Hayır | **Structured**, **Balanced**, **Open-ended** |
| 9b) Lecture-based vs. Discussion-based? | Üç kart | Hayır | **Lecture**, **Balanced**, **Discussion** |
| 9c) Research-driven vs. Application-driven? | Üç kart | Hayır | **Research**, **Balanced**, **Application** |
| 9d) Theoretical vs. Hands-on? | Üç kart | Hayır | **Theoretical**, **Balanced**, **Hands-on** |
| 10a) Competitive or Collaborative? | Üç kart | Hayır | **Competitive**, **Balanced**, **Collaborative** |
| 10b) Introverted or Socially energized? | Üç kart | Hayır | **Introverted**, **Balanced**, **Socially energized** |
| 10c) Large networks or Tight circles? | Üç kart | Hayır | **Large networks**, **Balanced**, **Tight circles** |
| 10d) Independent or Guided? | Üç kart | Hayır | **Independent**, **Balanced**, **Guided** |

---

## Step 3 — Career & academics

| Soru / alan | Tür | Zorunlu | Seçenekler / koşul |
|-------------|-----|---------|---------------------|
| Do you have a career path in mind? | Üç kart | Evet (UI “Required”) | **Yes**, **Not sure**, **No** |
| What career path? | Metin | Evet *yalnızca* Yes ise | — |
| How confident are you about your career path? (1–10) | Slider | Hayır | 1–10 |
| Areas of interest / intended major category | Çoklu seçim (pill) | Hayır | **STEM**, **Health Professions**, **Business**, **Humanities**, **Social Sciences**, **Arts**, **Education**, **Other** — Other seçilirse metin: “Specify other (e.g. Pre-law)” |
| Target degree: highest you plan to attain | Select | Hayır | **MA**, **MS**, **GD**, **LLM**, **PHD**, **Ed.D**, **MD**, **DO**, **DDS**, **DVM**, **Not sure** |
| Do you know the courses that will help you stand out for your intended path? | Üç kart | Hayır | **Yes**, **Somewhat**, **No** |
| Do you know the activities that will help you stand out? (1–10) | Slider | Hayır | 1–10 |
| How important are placement rates (e.g. Med school, Law school) to you? (1–10) | Slider | *Koşullu* | Yalnızca: career = **Yes**, güven ≥ 7, ve ilgi alanlarında **STEM** veya **Health Professions** veya “other” metninde `law` / `pre-law` (büyük/küçük harf duyarsız) varsa gösterilir |

---

## Step 4 — Tests & credits

### GPA ve sınavlar

| Soru / alan | Tür | Zorunlu | Seçenekler / alt alanlar |
|-------------|-----|---------|---------------------------|
| Your GPA | Ölçek + sayı | Hayır | Ölçek: **4.0 scale** veya **5.0 scale** — değer 0 ile seçilen ölçek arası |
| Exams taken (check all that apply) | Çoklu seçim (kart) | Hayır | **ACT**, **SAT**, **SAT Subject**, **AP**, **IB**, **Cambridge**, **TOEFL**, **PTE Academic**, **IELTS**, **Duolingo**, **PSAT** |

**Seçilen sınavlara bağlı skor alanları (hepsi opsiyonel / koşullu):**

- **PSAT:** Total (sayı)
- **SAT:** Reading & Writing, Math, Total (optional)
- **ACT:** Composite; opsiyonel: English, Math, Reading, Science
- **AP:** Number of AP exams; Average score (optional, 1–5, 0.5 adım)
- **IB:** IB predicted/achieved total
- **TOEFL / IELTS / Duolingo / PTE Academic:** ilgili skor alanları (hangisi seçildiyse)

*Not:* `SAT Subject` ve `Cambridge` listede var; bu adımda bunlar için ek skor satırı tanımlı değil (yalnızca seçim).

### Rigorous courses

| Soru / alan | Tür | Zorunlu |
|-------------|-----|---------|
| Rigorous courses: AP, IB, Honors — completed and this year | Sayı çiftleri | Hayır |
| — AP | Completed, This year | — |
| — IB | Completed, This year | — |
| — Honors | Completed, This year | — |

### Diğer

| Soru / alan | Tür | Zorunlu | Seçenekler |
|-------------|-----|---------|------------|
| Have you received any college credits? If yes, from which college? | Yes / No + metin | Hayır | **Yes** → “Which college(s)?” textarea — **No** |
| Have you attended any programs at a college or done research with a college professor? | Yes / No + metin | Hayır | **Yes** → “Describe” textarea — **No** |
| I believe I will benefit from Tutoring: | Dört kart | Hayır | **Individual**, **Small group**, **Large group**, **No** |
| Any irregularities or difficulties during your preparation or in high school? | Uzun metin | Hayır | — |

---

## Step 5 — Activities & achievements

### Aktiviteler

| Soru / alan | Tür | Zorunlu | Seçenekler / alt alan |
|-------------|-----|---------|------------------------|
| Activity types — select each you do, then add weeks and hours per week | Çoklu kart | Hayır | **Arts/Music**, **Clubs**, **Community engagement**, **Family responsibilities**, **Hobbies**, **Sports**, **Work/Volunteering** — seçilen her tür için: **Weeks**, **Hours/week** (sayı) |
| Rank your activities/extracurriculars (1 = most important) | Sıralama (yukarı/aşağı) | Hayır | Sabit dört kategori sıralanır: **Leadership**, **Volunteer**, **Hobbies & clubs**, **Academic** |

### Ödüller

| Soru / alan | Tür | Zorunlu |
|-------------|-----|---------|
| School level — honors and awards | Liste (Add ile çoğaltılır) | Hayır |
| State level — honors and awards | Aynı | Hayır |
| National level — honors and awards | Aynı | Hayır |
| International level — honors and awards | Aynı | Hayır |

Her öğe: **Title** (metin), **Short description (optional)** (metin).

---

## Step 6 — Review your profile

Bu adımda hem **yeni sorular** hem **önceki adımlardan özet** bulunur.

### Yeni sorular (form)

| Soru / alan | Tür | Zorunlu | Seçenekler |
|-------------|-----|---------|------------|
| How confident are you in the college admission process? (1–10) | Slider | Hayır (varsayılan orta değer) | 1–10 |
| How important is it to attend a selective college? (1–10) | Slider | Hayır | 1–10 |
| Which states do you want to go to college in? | Çoklu pill | Hayır | Tüm ABD eyaletleri + **DC** (Step 1 ile aynı `US_STATES` listesi) |
| 31a) Urban, suburban, or rural? | Üç kart | Hayır | **Urban**, **Suburban**, **Rural** |
| 31b) 200-person lecture or 12-person seminar? | Üç kart | Hayır | **Large lecture**, **Balanced**, **Small seminar** |
| 31c) Mandatory humanities core or total flexibility (open curriculum)? | Üç kart | Hayır | **Core**, **Balanced**, **Open curriculum** |
| 31d) Weekly quizzes or 3 high-stakes exams? | Üç kart | Hayır | **Weekly quizzes**, **Balanced**, **High-stakes exams** |
| 31e) High-achievement intensity vs. balanced life? | Üç kart | Hayır | **High intensity**, **Balanced**, **Balanced life** |
| Do you have a college list? | İki kart | Hayır | **Yes**, **No** |
| What are the best reach/match/safety colleges for you currently? | Textarea | Hayır *(Yes ise)* | — |
| Which ones have you visited? | Textarea | Hayır | — |
| What do you specifically like about them? | Textarea | Hayır | — |
| Do you plan to apply Early Decision, Early Action, or Regular Decision? | Dört kart | Hayır | **ED**, **EA**, **RD**, **Not sure** |

### Özet bölümü (salt okunur)

Özet kartında önceki cevaplardan örnekler: ad, doğum tarihi, cinsiyet, konum, lise, mezuniyet yılı, sınıf, GPA, SAT/ACT özeti, hedef eyaletler, kampüs tercihi — bunlar yeni soru değil, veri gösterimidir.

---

## Step 7 — Create your account

Hesap oluşturma; kişiselleştirme sorusu değil, kayıt alanları:

| Alan | Tür | Zorunlu |
|------|-----|---------|
| Continue with Google | Buton | — |
| Email | E-posta | E-posta ile kayıtta evet |
| Password | Parola (min 6 karakter) | E-posta ile kayıtta evet |

---

## Profilden düzenleme

`?from=profile` ile aynı formlar açıldığında **Next / Save** tamamlanınca kullanıcı `/app/profile` adresine yönlendirilir; Step 7 hesap adımı bu modda atlanır.

---

*Son güncelleme: kod tabanına göre statik çıkarım (`step-1` … `step-7` sayfaları).*
