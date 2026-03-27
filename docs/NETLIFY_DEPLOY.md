# Netlify'da deploy – Environment variables

Netlify'da siteyi deploy ettikten sonra **key'leri (environment variables)** şuradan ekleyin:

## Nereye eklenir?

1. [Netlify Dashboard](https://app.netlify.com) → sitenizi seçin  
2. **Site configuration** (veya **Site settings**)  
3. Sol menüden **Environment variables**  
4. **Add a variable** / **Add environment variables**  
5. Her key için **Key** ve **Value** girin.  
   - **Scopes:** Production, Preview, Development hepsinde kullanacaksanız "All" seçin.

Değişiklikten sonra **Trigger deploy** veya **Deploys** → **Trigger deploy** ile yeniden build alın; env değişkenleri yeni build’te kullanılır.

---

## Eklenmesi gereken key'ler

`.env.example` ile aynı. Değerleri **asla** bu dosyaya veya repoya yazmayın; sadece Netlify UI’da girin.

### Zorunlu – App & Firebase (client)

| Key | Açıklama |
|-----|----------|
| `NEXT_PUBLIC_APP_URL` | Canlı site URL’i, örn. `https://sitename.netlify.app` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project settings → General → Web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `proje-id.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Proje ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `proje-id.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sayısal sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app ID |

### Zorunlu – Firebase Admin (server; API / auth için)

Service account’tan alın: Firebase Console → Project settings → **Service accounts** → **Generate new private key**.

| Key | Açıklama |
|-----|----------|
| `FIREBASE_ADMIN_PROJECT_ID` | Proje ID (yukarıdaki ile aynı) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | `firebase-adminsdk-...@proje-id.iam.gserviceaccount.com` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | JSON’daki `private_key` değeri. **Netlify’da tek satırda yapıştırın;** satır sonları `\n` olarak kalabilir (genelde otomatik kabul edilir). Tüm değeri çift tırnak içinde tek satırda da yapıştırabilirsiniz. |

### Zorunlu – API keys (server)

| Key | Açıklama |
|-----|----------|
| `OPENAI_API_KEY` | [OpenAI API keys](https://platform.openai.com/api-keys) |
| `COLLEGE_SCORECARD_API_KEY` | [College Scorecard API](https://collegescorecard.ed.gov/data/documentation/) (API key) |

### İsteğe bağlı

| Key | Açıklama |
|-----|----------|
| `UNSPLASH_ACCESS_KEY` | [Unsplash API](https://unsplash.com/developers) – college hero görselleri için |

---

## Netlify build ayarları (Next.js)

- **Build command:** `npm run build` veya `npx next build`  
- **Publish directory:** `.next` değil; Next.js için Netlify’ın **Next.js runtime** kullanması gerekir.  
  - **Import** ile GitHub repo bağlandığında Netlify genelde Next’i otomatik tanır.  
  - Framework: **Next.js** seçili olsun.  
  - Publish directory çoğunlukla **otomatik** kalır (Next için özel).

Next.js’i Netlify’da çalıştırmak için **Netlify Next.js plugin** kullanılır; `npm run build` yeterli olur, publish directory’i Netlify halleder.

---

## Özet

1. Netlify → **Site configuration** → **Environment variables**.  
2. Yukarıdaki tablolardaki tüm **Key** isimlerini ve kendi **Value**’larınızı ekleyin.  
3. **FIREBASE_ADMIN_PRIVATE_KEY** için JSON’dan kopyaladığınız `private_key` değerini olduğu gibi yapıştırın; gerekirse Netlify’da “Insert newline” ile satır sonlarını ekleyin.  
4. **Save** → **Trigger deploy** ile yeniden deploy alın.

Bu key’leri sadece Netlify (ve gerekirse Netlify CLI) üzerinde tutun; repoya veya `.env` dosyasına koymayın.
