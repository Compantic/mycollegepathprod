# MyCollegePath — CrewAI Çoklu Ajan Mimarisi Tasarım Raporu

**Belge türü:** Teknik / ürün mimarisi  
**Hedef:** Beş özelliğe hizmet eden, öğrenci bağlamını paylaşan CrewAI tabanlı ajan ekosistemi  
**İlgili ürün alanları:** AI Consultant (sohbet), Essays, College Matching, My Roadmap, My AI Score  

---

## 1. Mevcut durum ve geçiş perspektifi

### 1.1 Bugünkü sistem (özet)

Projede halihazırda **tek çağrılı LLM akışları** ve **deterministik + hibrit motorlar** var; bunlar CrewAI “ekibi” ile **değiştirilmek zorunda değil**, genelde **aynı kalıp içinde sarılır** veya ajanlar **araç (tool)** olarak çağırır:

| Alan | Yaklaşım (koddan) |
|------|-------------------|
| **AI Consultant** | `runAdmissionsCoachWithContext`: profil + favoriler + son match run + mention çözümleme; tek completion. |
| **College Matching** | `lib/matching/engine.ts`: aday toplama, heuristik skor, isteğe bağlı OpenAI ağırlık önerisi ve metinsel “fit” katkısı. |
| **My AI Score** | `app/api/ai-score/calculate`: kompakt profil JSON → skor + özet + güçlü/zayıf yanlar (JSON). |
| **My Roadmap** | `lib/roadmap/engine.ts`: kural tabanlı gap analizi, faz şablonları, LLM ile özelleştirme/narrative (mevcut yapı zaten “ajan benzeri” adımlara bölünmüş). |
| **Essays** | (Uygulamaya göre) taslak içerik, promptlar, geri bildirim — genelde ayrı API/route üzerinden LLM. |

**Sonuç:** CrewAI, bu parçaları **orkestre eden üst katman** olabilir; kritik skorlar ve listeler için **deterministik motor + denetlenebilir çıktı** korunmalıdır.

### 1.2 Neden beş ayrı ajan?

- Her ürün yüzeyinin **görevi, tonu ve güvenlik sınırı** farklı (ör. essay’de tam yazım yok, consultant’ta tavsiye dili).
- Ortak **Student Context Package** tek kaynaktan beslenir; ajanlar **farklı çıktı şemaları** üretir.
- İleride **paralel crew** (eşzamanlı analiz) veya **hiyerarşik crew** (koordinatör ajan) ile maliyet/latency ayarlanabilir.

---

## 2. Ortak veri katmanı: Student Context Package (SCP)

Tüm ajanların girdi olarak kullanacağı, sunucuda toplanan **tek bir yapı** tanımlanmalıdır (PII ve minimizasyon kurallarına uygun).

### 2.1 Önerilen alanlar

| Kategori | Alanlar |
|----------|---------|
| **Kimlik (minimal)** | `userId`, tercihen `firstName` / `displayName` (sohbet kişiselleştirmesi için). |
| **Onboarding / profil** | GPA, testler, sınıf, mezuniyet yılı, ilgi alanları, kariyer yolu, aktiviteler, ödüller, kampüs/lokasyon tercihleri, liste stratejisi vb. |
| **Sohbet** | Son N mesaj özeti (embedding veya LLM özeti), uzun vadeli “hafıza” anahtarları (isteğe bağlı). |
| **Favoriler** | `collegeId`, okul adı, kullanıcı notu (varsa). |
| **Son eşleştirme koşusu** | `runId`, her okul için `matchScore`, `tier`, `reasons`, `factorBreakdown` (varsa). |
| **Essay envanteri** | Essay türü, prompt, taslak metin, sürüm, son geri bildirim özeti. |
| **Roadmap** | Son üretilen fazlar, gap’ler, tamamlanan görev id’leri. |
| **AI Score** | Son skor, özet, strengths/improvements, hesaplama zamanı. |
| **Meta** | Zaman damgası, dil tercihi, ülke/eyalet (uyumluluk). |

### 2.2 İlkeler

- **Tek doğruluk kaynağı:** Firestore / mevcut API’ler; ajanlar doğrudan ham DB yerine **sunucunun ürettiği SCP snapshot** ile çalışır.
- **Versiyonlama:** `scpVersion` ile şema değişince geriye dönük uyum.
- **Redaksiyon:** SSN, tam adres, reşit olmayan için gereksiz hassas veri gönderilmez.

---

## 3. CrewAI süreç modeli önerisi

### 3.1 İki katmanlı kullanım

1. **Özellik bazlı mini-crew’ler (önerilen başlangıç)**  
   Her ürün sayfası kendi 2–3 adımlı mini akışını çalıştırır (düşük risk, kolay debug).

2. **Tam “platform crew” (ileri seviye)**  
   Bir **Koordinatör Ajan** sırayla veya paralel olarak diğer uzman çıktılarını birleştirir (ör. haftalık “durum raporu”).

### 3.2 CrewAI `Process` seçimi

| Senaryo | Process | Gerekçe |
|---------|---------|---------|
| Essay geri bildirimi + revizyon planı | `sequential` | Taslak analizi → öneriler → son kontrol listesi. |
| College listesi denetimi | `sequential` veya `hierarchical` | Önce veri doğrulayıcı, sonra strateji uzmanı. |
| Haftalık özet (tüm modüller) | `hierarchical` | Koordinatör alt ajan çıktılarını birleştirir. |

---

## 4. Beş ajan: rol, adımlar, çıktılar, kaynaklar

Aşağıdaki her ajan için: **görev tanımı**, **tipik iş akışı**, **beklenen çıktı formatı**, **kullanacağı kaynaklar / araçlar**, **diğer ajanlarla ilişki** verilmiştir.

---

### 4.1 Ajan 1 — AI Consultant Agent (Kabul Danışmanı / Sohbet)

**Rol:** Öğrencinin sorularına yanıt veren, profil ve liste bağlamında **rehberlik** sunan; tıbbi/hukuki iddia üretmeyen, okul seçimini “garanti” etmeyen asistan.

**Temel görevler**

1. Kullanıcı niyetini sınıflandır (bilgi mi, strateji mi, duygusal destek mi, okul karşılaştırması mı).
2. SCP’den ilgili alt küme çek (akademik özet, favoriler, son match, kısa sohbet özeti).
3. Bahsedilen okulları çözümle (mevcut: isim → id, match kartı ile zenginleştirme).
4. Yanıtı **kısa başlık + maddeler** ile yapılandır; gerekiyorsa “sonraki adım” öner.

**Adım adım (örnek)**

| Adım | Ne yapar? |
|------|-----------|
| 1 | Son kullanıcı mesajı + son 10 mesaj özeti okunur. |
| 2 | Niyet: örn. “MIT vs Stanford stratejisi” → match + favori + test profili getirilir. |
| 3 | Politika kontrolü: garanti yok, resmi siteye yönlendirme hatırlatması. |
| 4 | Yanıt üretilir; istenirse `suggestedFollowUps[]` alanı eklenir. |

**Çıktı**

- Sohbet için: düz metin (mevcut API ile uyumlu).
- İsteğe bağlı yapılandırılmış ek: `{ topicsTouched[], collegesReferenced[], riskFlags[] }` (analitik / moderasyon).

**Kaynaklar / araçlar**

- **Araç:** `get_student_context`, `resolve_college_mention`, `get_match_card`, `save_chat_summary` (opsiyonel).
- **Veri:** `ChatContext` ile aynı mantık (`lib/ai/chatContext.ts`).

**Diğer ajanlarla ilişki**

- **College Matching Agent** çıktısını **okur**; skoru değiştirmez.
- **Essay Agent**a “essay konusu açtı” sinyali gönderilebilir (ayrı thread).

---

### 4.2 Ajan 2 — Essay Agent (Komisyon Okuyucusu / Yazı Koçu)

**Rol:** Common App, ek yazılar ve okul özel promptları için **geri bildirim**, **yapı önerisi**, **ton uyumu**; **tam metin yerine yazma** politikası ürün kararına bağlı (çoğu üründe “rewrite yok, öneri var” güvenlidir).

**Temel görevler**

1. Essay türü ve prompt ile taslağı hizala (prompta cevap veriyor mu?).
2. Hikâye yayı (narrative arc), spesifiklik, “show don’t tell”, kelime sınırı.
3. Riskli içerik (aşırı kişisel, başkalarını suçlayan) için **nazik uyarı**.
4. Revizyon için **önceliklendirilmiş görev listesi** üret.

**Adım adım**

| Adım | Ne yapar? |
|------|-----------|
| 1 | Metin + okul/prompt meta verisini alır. |
| 2 | SCP’den aktiviteler/ilgi alanları ile **tutarlılık** kontrolü (çelişen iddia var mı). |
| 3 | Bölüm bazlı geri bildirim (giriş, gövde, kapanış). |
| 4 | JSON şemasına göre çıktı (UI’da kartlara dökülebilir). |

**Çıktı (örnek şema)**

```json
{
  "alignmentScore": 0-100,
  "hookStrength": "weak|ok|strong",
  "feedbackBySection": [{ "section": "opening", "comment": "..." }],
  "concreteEdits": [{ "quote": "...", "suggestion": "..." }],
  "nextSteps": ["...", "..."],
  "safetyNote": null
}
```

**Kaynaklar / araçlar**

- Essay dokümanları (Firestore veya mevcut essay API).
- İsteğe bağlı: `get_activity_list`, `get_college_supplemental_prompt` (scraping yoksa kurumsal veri).

**Diğer ajanlarla ilişki**

- **AI Score Agent** ve **Roadmap Agent** essay eksikliğini “iyileştirme” olarak görebilir.
- **Consultant** aynı oturumda özet essay durumunu sorarsa bu ajanın **son özeti** kullanılabilir.

---

### 4.3 Ajan 3 — College Matching Agent (Liste Stratejisti + Açıklayıcı)

**Rol:** Mevcut **deterministik skor motorunu** ikame etmek zorunda değil; ajanın işi **yorumlama**, **liste dengesi**, **okul başına eylem** ve **“neden bu skor”** anlatımını zenginleştirmek.

**Temel görevler**

1. Son koşudan gelen `matches[]` ve kullanıcı favorilerini oku.
2. Reach / match / safety dağılımını değerlendir (tier alanlarından).
3. Eksik veri uyarıları (`dataLimited`) için kullanıcı dilinde açıklama.
4. Okul başına 2–3 maddelik **aksiyon** (test planı, essay ağırlığı, ziyaret önerisi).

**Adım adım**

| Adım | Ne yapar? |
|------|-----------|
| 1 | `MatchingRunResult` + SCP akademik alanlarını alır. |
| 2 | Motor çıktısını **değiştirmeden** özetler (veya sadece “açıklama metni” üretir). |
| 3 | Favoriler ile skorları karşılaştırır: “favori ama düşük skor” çelişkisi varsa tartışır. |
| 4 | Öğrenci sınıf yılına göre zamanlama önerir. |

**Çıktı**

- Kullanıcıya: markdown veya yapılandırılmış `schoolInsights[]`.
- İç kullanım: `listHealth: { reachPct, matchPct, safetyPct, gaps[] }`.

**Kaynaklar / arağlar**

- **Araç:** `run_matching_engine` (mevcut TypeScript fonksiyonunu sarar), `get_scorecard_snippet` (College Scorecard alanları).
- **Veri:** `CollegeMatch`, `factorBreakdown`.

**Diğer ajanlarla ilişki**

- **AI Consultant** bu ajanın özetini sohbette kullanır.
- **Roadmap Agent** liste boşsa gap üretir (zaten roadmap motorunda benzer kural var).

---

### 4.4 Ajan 4 — My Roadmap Agent (Yol Haritası Planlayıcısı)

**Rol:** Öğrencinin sınıf düzeyi, mezuniyet yılı, profil boşlukları ve ürün içi ilerlemeye göre **fazlı plan**, **öncelikli görevler**, **deadline yaklaşımı**.

**Temel görevler**

1. Kural tabanlı gap listesini (mevcut `profileGapAgent` mantığı) girdi olarak al veya yeniden üret.
2. SCP’den essay durumu, test durumu, kayıtlı okul sayısını al.
3. Fazları özelleştir: örn. “Class of 2026 + düşük aktivite” → faz 1 ağırlığı.
4. Her görev için **ölçülebilir tanım** (üründe checkbox ile eşleşen `item.id` korunmalı).

**Adım adım**

| Adım | Ne yapar? |
|------|-----------|
| 1 | `RoadmapAgentContext` benzeri yapı oluşturulur. |
| 2 | LLM, şablon fazları **yeniden sıralar veya metinleri kişiselleştirir** (motor kararları deterministik kalabilir). |
| 3 | AI Score’daki “improvements” maddeleri görevlere **map** edilir. |
| 4 | `RoadmapResult` şemasına uygun JSON üretilir. |

**Çıktı**

- Mevcut `RoadmapResult` (`phases`, `gaps`, `summary`, `studentName`, `graduationYear`) ile uyumlu nesne.

**Kaynaklar / araçlar**

- `lib/roadmap/engine.ts` içindeki özet fonksiyonları ve LLM çağrısı.
- **Araç:** `get_roadmap_history`, `get_ai_score_last`, `get_essay_status`.

**Diğer ajanlarla ilişki**

- **AI Score Agent** çıktısı doğrudan görev önceliğine girer.
- **College Matching Agent** liste sağlığını roadmap’e bağlar.

---

### 4.5 Ajan 5 — My AI Score Agent (Profil Hazırlık Değerlendiricisi)

**Rol:** Öğrencinin başvuru hazırlığını **tek skor** ve **açıklanabilir** alt başlıklarla sunmak; mevcut API’deki ağırlıklarla uyumlu kalır: akademik %40, test %20, aktivite/ödül %20, netlik/fit %20.

**Temel görevler**

1. SCP kompakt özetini oluştur (AI Score route’daki gibi).
2. Eksik veri cezalarını tutarlı uygula (model veya kural katmanı).
3. Skoru **gerekçelendir** (hangi alan puana nasıl etki etti).
4. “Oyunlaştırma” tonundan kaçın; **eğitici** dil kullan.

**Adım adım**

| Adım | Ne yapar? |
|------|-----------|
| 1 | Profil tamlık metrikleri hesaplanır (deterministik). |
| 2 | LLM, metinsel özeti ve maddeleri üretir (JSON). |
| 3 | Skor, kurallarla clamp edilir (0–100). |
| 4 | Son koşum Firestore’a yazılır (mevcut `saveAiScoreForServer`). |

**Çıktı**

- `AiScoreModelOutput`: `score`, `summary`, `strengths[]`, `improvements[]` (mevcut API ile aynı).

**Kaynaklar / araçlar**

- `getDashboardUserData` özeti.
- İsteğe bağlı: son essay sayısı, roadmap tamamlanma oranı (skor açıklamasında kullanılır, ağırlık ürün kararı).

**Diğer ajanlarla ilişki**

- **Roadmap** ve **Consultant** bu skoru “özet kart” olarak gösterir.
- **Matching Agent** skoru liste önerilerinde **doğrudan kullanmamalı** (çifte sayım riski); sadece nitel geri bildirim için.

---

## 5. Örnek orkestrasyon senaryoları

### 5.1 Senaryo A — “Profilimi güçlendir” (tek tık)

**Sıra:** AI Score Agent → Roadmap Agent (improvements’ı görevlere çevir) → Consultant özet mesajı (isteğe bağlı tek paragraf).

### 5.2 Senaryo B — “Listemi gözden geçir”

**Sıra:** Matching motoru çalışır (deterministik) → College Matching Agent açıklama üretir → Consultant’a özet enjekte edilir.

### 5.3 Senaryo C — Essay oturumu

**Sıra:** Essay Agent tam analiz → (isteğe bağlı) ikinci geçiş “kısaltılmış versiyon” için sequential ikinci ajan → çıktı essay UI’sına yazılır.

---

## 6. Teknik uygulama notları (CrewAI + Next.js)

- **Çalışma yeri:** CrewAI görevleri tercihen **sunucu tarafı** (Route Handler / Cloud Function); istemcide API anahtarı sızmaz.
- **Araç tanımı:** Her “tool”, mevcut TypeScript fonksiyonlarına ince bir wrapper olmalı (`runMatching`, `getProfile`, vb.).
- **Çıktı şeması:** Kritik JSON’lar için **Zod / JSON schema** ile doğrulama; başarısızsa yeniden deneme veya fallback (AI Score ve Roadmap’te olduğu gibi).
- **Gözlemlenebilirlik:** `runId`, ajan adı, token tahmini, latency loglanır.
- **Maliyet:** Mini-crew başına model seçimi (`gpt-4o-mini` ağır işler için yeterli olabilir); koordinatör için daha güçlü model ürün kararı.

---

## 7. Riskler ve uyumluluk

| Risk | Önlem |
|------|--------|
| Halüsinasyon (okul istatistiği) | Sayıları **Scorecard / DB** kaynağından ver; LLM sadece yorumlasın. |
| Essay’de etik (intihal, başkasına yazdırma) | Politika metni + kullanıcıya sorumluluk hatırlatması. |
| Skor manipülasyonu | Skor = kural + LLM metni; LLM tek başına skoru belirlemesin (veya clamp). |
| Gizlilik (FERPA benzeri hassasiyet) | SCP minimizasyonu, log redaksiyonu. |

---

## 8. Önerilen uygulama fazları

| Faz | İçerik |
|-----|--------|
| **Faz 0** | SCP snapshot builder + tool arayüzleri; tek ajan pilot (Essay veya Consultant). |
| **Faz 1** | College Matching açıklama ajanı + mevcut motor korunur. |
| **Faz 2** | AI Score ve Roadmap’i aynı SCP ile CrewAI’ye taşıma (fallback’ler açık). |
| **Faz 3** | Hiyerarşik “haftalık özet” crew’si; analitik alanlar. |

---

## 9. Sonuç

Bu rapor, MyCollegePath için **beş ürün yüzeyine** karşılık gelen **beş uzman ajan** tanımlar; mevcut kod tabanındaki **sohbet bağlamı**, **matching motoru**, **AI Score API** ve **roadmap engine** ile **doğrudan hizalanmıştır**. CrewAI entegrasyonunda kritik nokta, **deterministik skor ve veri kaynaklarını** ajanlara **araç** olarak vermek ve LLM’i **açıklama / planlama / geri bildirim** katmanında tutmaktır.

---

*Belge tarihi: Mart 2026 — kod referansları: `lib/ai/admissionsChat.ts`, `lib/ai/chatContext.ts`, `lib/matching/engine.ts`, `app/api/ai-score/calculate/route.ts`, `lib/roadmap/engine.ts`.*
