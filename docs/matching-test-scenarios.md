## College Matching – Test Senaryoları ve Kontroller

Bu dosya, yeni agent-tabanlı college matching motorunu manuel olarak doğrulamak için kullanılacak
hedefli senaryoları özetler. Her senaryoda `/app/collegematching` sayfasından **Run Matching** tuşu
kullanılır (arka planda `/api/matching/run` çağrılır).

### Senaryo 1 – Temel profil, tek eyalet

- **Onboarding / Profil**
  - GPA: 3.0 civarı
  - SAT/ACT: boş bırakılabilir
  - Preferred states: yalnızca `CA` (California)
  - Campus size: `medium`
- **Beklenenler**
  - \"Your matches\" bölümünde **100'e kadar** okul listelenir (`Your matches (N)` başlığı ile).
  - Okulların büyük çoğunluğu `CA` eyaletindendir; başka eyaletlerden birkaç okul gelebilir.
  - Match skorları 40–85 aralığına yayılmış olmalı, yalnızca tek bir değerde (ör. %56) toplanmamalı.
  - Kart etiketlerinde \"In your preferred state\" veya \"Campus size matches your preference\" gibi
    nedenler görünmelidir.

### Senaryo 2 – Yüksek seçicilik isteyen güçlü akademik profil

- **Onboarding / Profil**
  - GPA: 3.9+
  - SAT: 1450+ veya ACT: 32+
  - `selectivityImportance`: 9–10 (yüksek)
  - Rigor: birden fazla AP/IB/Honors dersi işaretli
  - Areas of interest: `STEM` veya `Health Professions`
- **Beklenenler**
  - İlk 20–30 okulun çoğu daha seçici (düşük admission_rate) kurumlardan oluşur; reach/match karışımı vardır.
  - Kartlarda akademik nedenler öne çıkar: \"Strong SAT fit\", \"GPA aligned with school selectivity\" vb.
  - \"How to improve your chances\" bölümünde test skorlarını artırma veya listede reach/match/safety
    dengesini kurmaya yönelik tavsiyeler görünür.

### Senaryo 3 – Dengeli hayat isteyen, aktiviteleri güçlü öğrenci

- **Onboarding / Profil**
  - Activity types: en az 3–4 farklı kategori (Sports, Community engagement, Hobbies, Work/Volunteering)
  - Awards: birkaç school/state/national ödülü girilmiş
  - `campusIntensityVsBalanced`: \"Balanced life\"
  - Preferred size: `small` veya `medium`
  - Preferred states: 3–4 farklı eyalet (örn. `MA`, `NY`, `CA`, `WA`)
- **Beklenenler**
  - Önerilen 100 okul birkaç farklı eyalete dağılmıştır; tek bir eyaletten uzun bloklar yoktur
    (per-state limit ~5 civarında uygulanır).
  - Kart nedenleri arasında aktiviteler ve kampüs boyutu ile ilgili açıklamalar yer alır:
    \"Larger campus offers many opportunities for your activities\" vb.
  - Çok büyük kampüsler için (çok yüksek öğrenci sayısı) eşleşme skoru hafifçe düşer ve açıklamada
    \"Very large campus may feel intense; we slightly lower this match\" gibi bir uyarı görülebilir.

### Senaryo 4 – Onboarding'i boş/eksik bırakan kullanıcı

- **Onboarding / Profil**
  - Sadece minimum alanlar doldurulmuş, çoğu soru boş.
- **Beklenenler**
  - Sistem yine de **100'e kadar okul** döndürür, ancak kartlarda \"Add test scores and GPA in your profile
    for better academic fit\" gibi iyileştirme mesajları sıkça görünür.
  - Eşleşme skorları daha dar ama tamamen tek değere yığılmamış durumda olur (ör. %50 civarı etrafında
    dağılmış).

### Teknik Kontroller

- Farklı kullanıcı profilleri için `/api/matching/run` yanıtında dönen `matches` dizisinin uzunluğu
  çoğu durumda 100 olmalı; çok kısıtlı eyalet/filtre kombinasyonlarında daha az olabilir.
- Aynı kullanıcı için birden fazla kez matching çalıştırıldığında; veri kısıtlı okullarda küçük
  bir jitter (0–7 puan) olduğundan, özellikle \"Limited data\" etiketli okulların skorları arasında
  hafif farklılıklar gözlenebilir ama genel sıralama mantıklı kalmalıdır.

