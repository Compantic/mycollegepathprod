# Web App Evaluation Report

## Overall Score
**Score: 84/100**

---

## 1. Content / Feature / Page Suggestions

- **Dashboard’a “Weekly Action Score” modülü eklenmeli**; çünkü kullanıcıya haftalık ilerleme net gösterilmiyor; bu, geri dönüş sıklığını ve görev tamamlama oranını artırır.
- **Onboarding sonrası “ilk 10 dakika” aktivasyon ekranı eklenmeli**; çünkü kullanıcı ilk girişte hangi adımı yapacağını bilmiyor; bu, first-session drop-off’u düşürür.
- **My AI Score için “unlock by plan” katmanı eklenmeli**; çünkü skor var ama monetization tetikleyicisi yok; bu, free’den paid’e geçişi artırır.
- **Matching sonuçlarına “Apply Now shortlist” aksiyon sayfası eklenmeli**; çünkü öneri var ama karar/uygulama adımı dağınık; bu, ürün içi tamamlanmış iş akışını güçlendirir.
- **Pricing içinde plan karşılaştırmasına gerçek kullanım limitleri (chat, roadmap, matching) eklenmeli**; çünkü plan farkı soyut kalıyor; bu, satın alma kararını hızlandırır.

---

## 2. Codebase / Stability / Scalability Suggestions

- **Risk:** Firestore leaderboard query’si index bağımlı kalabilir; **Neden:** prod’da anlık hata üretir; **Çözüm:** tek `orderBy` + server-side tie-break standardı ve index dokümantasyonu.
- **Risk:** Büyük client component’lerde state yoğunluğu yüksek (`dashboard`, `profile`, `roadmap`); **Neden:** regresyon ve render maliyeti artar; **Çözüm:** feature hook’lara böl ve section-level memo/lazy uygula.
- **Risk:** API timeout/retry politikası endpoint bazında tutarlı değil; **Neden:** dış servis dalgalanmasında kullanıcı hatası artar; **Çözüm:** ortak HTTP policy helper (timeout, retry, fallback) standardize et.
- **Risk:** Firestore read pattern’lerinde pagination standardı her yerde yok; **Neden:** 10k+ kullanıcıda maliyet/latency sıçrar; **Çözüm:** tüm liste endpoint’lerine cursor + limit zorunluluğu getir.
- **Risk:** Observability sınırlı; **Neden:** prod issue kök sebebi geç bulunur; **Çözüm:** Sentry + API latency/error metric + request correlation ID ekle.
- **Risk:** Env doğrulama runtime’da dağınık; **Neden:** yanlış deploy’da kritik feature kapanır; **Çözüm:** startup env schema validation ve CI’da fail-fast kontrolü ekle.
- **Risk:** Yetkilendirme rol genişlemesine hazır değil; **Neden:** admin/mentor eklendiğinde endpoint riski oluşur; **Çözüm:** central authorization matrix + helper middleware tasarla.
- **Risk:** Uzun vadeli rate-limit doküman birikimi; **Neden:** storage/maintenance yükü artar; **Çözüm:** TTL veya scheduled cleanup job tanımla.
- **Risk:** Landing page dış görsellere bağımlı; **Neden:** hotlink kırılırsa UX bozulur; **Çözüm:** görselleri `public/` altında lokal host et ve optimize et.

---

## 3. Non-Working / Mock / Unnecessary Parts

- `AI Consultant` içindeki bazı UI aksiyonları (özellikle ek/attachment hissi veren alanlar) tam backend akışına bağlı değil; kullanıcıya “varmış” hissi veriyor.
- Landing/Pricing alanındaki bazı metrik ve testimonial içerikleri hardcoded; canlı veriyle doğrulanmıyor.
- Planlar görsel olarak var fakat uçtan uca billing/subscription enforcement akışı net değil (paywall + access control).
- Belirgin mock veya çalışmayan kritik bir parça tespit edilmedi.

