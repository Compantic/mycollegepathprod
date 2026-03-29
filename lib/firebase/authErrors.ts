/**
 * Maps Firebase Auth errors to short user-facing messages (Turkish).
 * See: https://firebase.google.com/docs/auth/admin/errors
 */
export type MappedAuthError = { kind: "no-account" } | { kind: "message"; text: string };

export function mapFirebaseAuthError(err: unknown): MappedAuthError {
  const code =
    err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";

  if (code === "auth/user-not-found") {
    return { kind: "no-account" };
  }

  const byCode: Record<string, string> = {
    "auth/wrong-password": "E-posta veya şifre hatalı. Tekrar deneyin veya şifrenizi sıfırlayın.",
    "auth/invalid-credential": "E-posta veya şifre hatalı. Bilgilerinizi kontrol edin.",
    "auth/invalid-login-credentials": "E-posta veya şifre hatalı. Bilgilerinizi kontrol edin.",
    "auth/invalid-email": "Geçerli bir e-posta adresi girin.",
    "auth/user-disabled": "Bu hesap devre dışı bırakılmış. Destek ile iletişime geçin.",
    "auth/too-many-requests": "Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.",
    "auth/network-request-failed": "Ağ hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.",
    "auth/invalid-api-key":
      "Firebase yapılandırması eksik veya hatalı. .env.local içindeki NEXT_PUBLIC_FIREBASE_* değerlerini kontrol edin.",
    "auth/popup-closed-by-user": "Google penceresi kapatıldı. Tekrar deneyin.",
    "auth/cancelled-popup-request": "Google girişi iptal edildi. Tekrar deneyin.",
    "auth/account-exists-with-different-credential":
      "Bu e-posta farklı bir giriş yöntemiyle kayıtlı. E-posta/şifre veya doğru Google hesabını kullanın.",
  };

  if (code && byCode[code]) {
    return { kind: "message", text: byCode[code] };
  }

  if (err instanceof Error && err.message) {
    return { kind: "message", text: err.message };
  }

  return { kind: "message", text: "Giriş başarısız. Lütfen tekrar deneyin." };
}
