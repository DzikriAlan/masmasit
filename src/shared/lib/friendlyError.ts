/**
 * Turns whatever an API, Supabase or the network threw into a sentence a
 * member can act on. Raw driver text ("JWT expired", "violates row-level
 * security policy", "Failed to fetch") never reaches the screen; it goes to the
 * console instead so it is still there when debugging.
 *
 * Pass the screen's own "Failed to X" message as `fallback`: it is shown when
 * the cause is not one of the known cases below.
 */

type Translate = (en: string, id: string) => string;

type Rule = { match: RegExp; en: string; id: string };

// First match wins, so the more specific cases sit above the broad ones.
// Patterns run against "<error code> <message>" in lower case.
const RULES: Rule[] = [
  // Sign-in and account
  { match: /invalid login credentials|invalid_credentials/, en: 'Wrong email or password.', id: 'Email atau kata sandi salah.' },
  { match: /email not confirmed|email_not_confirmed/, en: 'Your email is not verified yet. Check your inbox for the verification link.', id: 'Email Anda belum diverifikasi. Cek inbox untuk link verifikasi.' },
  { match: /already (been )?registered|user_already_exists|email_exists/, en: 'This email is already registered. Sign in, or reset your password if you forgot it.', id: 'Email ini sudah terdaftar. Silakan masuk, atau reset kata sandi jika lupa.' },
  { match: /should be different from the old|same_password/, en: 'Your new password must be different from the old one.', id: 'Kata sandi baru harus berbeda dari yang lama.' },
  { match: /password should (be|contain)|weak_password|weak password/, en: 'That password is too weak. Use at least 6 characters, mixing letters and numbers.', id: 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter, campuran huruf dan angka.' },
  { match: /unable to validate email|invalid email|email_address_invalid|invalid format/, en: 'That email address doesn\'t look right.', id: 'Alamat email sepertinya tidak valid.' },
  { match: /signups? not allowed|signup_disabled/, en: 'Registration is closed for now.', id: 'Pendaftaran sedang ditutup.' },
  { match: /user is banned|user_banned|is_suspended/, en: 'Your account is suspended. Please contact the MasmasIT team.', id: 'Akun Anda ditangguhkan. Silakan hubungi tim MasmasIT.' },
  { match: /access_denied|cancelled by the user|user denied/, en: 'Sign-in was cancelled.', id: 'Proses masuk dibatalkan.' },
  { match: /otp_expired|link is invalid or has expired|token has expired|code verifier|flow state|flow_state|invalid_grant|bad_code_verifier|auth code/, en: 'This link has expired or was opened in a different browser. Request a new one and open it in this browser.', id: 'Link ini sudah kedaluwarsa atau dibuka di browser lain. Minta link baru dan buka di browser ini.' },
  { match: /rate limit|too many requests|over_request_rate_limit|over_email_send_rate_limit|for security purposes, you can only request|\b429\b/, en: 'Too many attempts. Please wait a minute and try again.', id: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.' },
  { match: /jwt|session (missing|not found|expired)|refresh token|not authenticated|must be signed in|missing user|no user|^unauthorized/, en: 'Your session has ended. Please sign in again.', id: 'Sesi Anda sudah berakhir. Silakan masuk lagi.' },

  // Network
  { match: /failed to fetch|networkerror|network error|load failed|fetch failed|err_network|err_internet/, en: 'Can\'t reach the server. Check your internet connection and try again.', id: 'Tidak bisa terhubung ke server. Periksa koneksi internet lalu coba lagi.' },
  { match: /aborted|aborterror|timeout|timed out/, en: 'This is taking too long. Please try again.', id: 'Prosesnya terlalu lama. Silakan coba lagi.' },

  // Files
  { match: /exceeds|too large|payload too large|maximum allowed size|entity too large|\b413\b/, en: 'The file is too large. The maximum is 5 MB.', id: 'Ukuran file terlalu besar. Maksimal 5 MB.' },
  { match: /mime type|invalid_mime|not supported|unsupported/, en: 'This file type isn\'t supported. Try a JPG, PNG or PDF.', id: 'Jenis file ini tidak didukung. Coba JPG, PNG, atau PDF.' },
  { match: /canvas unavailable|could not encode image/, en: 'We couldn\'t process this image. Try another file.', id: 'Gambar ini tidak bisa diproses. Coba file lain.' },

  // Admin rules written in the API routes
  { match: /cannot suspend yourself/, en: 'You can\'t suspend your own account.', id: 'Anda tidak bisa menangguhkan akun sendiri.' },
  { match: /admins cannot be suspended/, en: 'Admins can\'t be suspended. Remove their admin role first.', id: 'Admin tidak bisa ditangguhkan. Cabut dulu peran admin-nya.' },
  { match: /revoke your own super admin/, en: 'You can\'t remove your own super admin role.', id: 'Anda tidak bisa mencabut peran super admin milik sendiri.' },
  { match: /another region/, en: 'This belongs to another region, so you can\'t change it.', id: 'Data ini milik region lain, jadi tidak bisa Anda ubah.' },
  { match: /nothing to update/, en: 'There are no changes to save.', id: 'Tidak ada perubahan untuk disimpan.' },

  // Database
  { match: /\b23505\b|duplicate key|already exists|^conflict/, en: 'This already exists.', id: 'Data ini sudah ada.' },
  { match: /\b23503\b|foreign key/, en: 'This is still linked to other data, so it can\'t be changed or removed yet.', id: 'Data ini masih terhubung dengan data lain, jadi belum bisa diubah atau dihapus.' },
  { match: /\b23502\b|not-null|null value/, en: 'A required field is still empty.', id: 'Ada kolom wajib yang masih kosong.' },
  { match: /value too long|\b22001\b/, en: 'Some text is too long. Please shorten it.', id: 'Ada teks yang terlalu panjang. Silakan dipersingkat.' },
  { match: /\b42501\b|row-level security|permission denied|do not have permission|refused this change|access required|^forbidden|not authorized/, en: 'You don\'t have permission to do this.', id: 'Anda tidak punya izin untuk melakukan ini.' },
  { match: /pgrst116|not[ _]found|0 rows|no\)? rows/, en: 'We couldn\'t find it. It may have been removed.', id: 'Data tidak ditemukan. Mungkin sudah dihapus.' },
  { match: /\b23514\b|\b22p02\b|check constraint|invalid input|invalid request|is required|must be|^validation_error/, en: 'Some details aren\'t valid. Please check what you entered.', id: 'Ada data yang tidak valid. Periksa kembali isian Anda.' },
];

const readError = (error: unknown) => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const { name, code, message } = error as { name?: unknown; code?: unknown; message?: unknown };
    // unwrapApiResponse puts the API error code in `name`.
    const tag = [code, name].find((v) => typeof v === 'string' && v !== 'Error') ?? '';
    return `${tag} ${typeof message === 'string' ? message : ''}`.trim();
  }
  return String(error);
};

export const friendlyError = (error: unknown, t: Translate, fallback?: string) => {
  const raw = readError(error);
  if (raw) console.error('[error]', raw);
  const text = raw.toLowerCase();
  // `^` patterns are meant for a bare API code, so test those against the code alone too.
  const rule = RULES.find((r) => r.match.test(text) || r.match.test(text.split(' ')[0] ?? ''));
  if (rule) return t(rule.en, rule.id);
  return fallback ?? t('Something went wrong. Please try again.', 'Terjadi kesalahan. Silakan coba lagi.');
};
