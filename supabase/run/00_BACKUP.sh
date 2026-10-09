#!/usr/bin/env bash
# =========================================================================
# SCRIPT 0 - BACKUP DATABASE (hanya membaca, tidak mengubah apa pun)
# =========================================================================
# Jalankan SEBELUM menerapkan migration atau 03_HAPUS_DUMMY.sql:
#
#   bash supabase/run/00_BACKUP.sh
#
# Koneksi diambil dari SUPABASE_CONNECTION_STRING di .env. Bisa ditimpa:
#
#   DB_URL='postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres' \
#     bash supabase/run/00_BACKUP.sh
#
# Hasil (di luar repo, supaya data user tidak ikut ter-commit):
#   ../backups/masmasit-prod-<tanggal-jam>/
#     public.dump        schema + data public (format custom, untuk pg_restore)
#     public.sql         sama, format SQL biasa (bisa dibaca / dijalankan di SQL Editor)
#     auth_data.dump     data akun login (auth.users, auth.identities, ...)
#     storage_data.dump  metadata file storage (isi file-nya TIDAK ikut)
#
# Restore contoh (ke project Supabase baru) - urutan penting, auth dulu
# karena tabel public merujuk ke auth.users:
#   pg_restore --data-only --no-owner -d "$DB_URL" auth_data.dump
#   pg_restore --no-owner --no-privileges -d "$DB_URL" public.dump
# =========================================================================
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_ROOT="${OUT_ROOT:-$REPO_DIR/../backups}"
STAMP="$(date +%Y%m%d-%H%M)"
OUT_DIR="$OUT_ROOT/masmasit-prod-$STAMP"

# Koneksi: DB_URL > SUPABASE_CONNECTION_STRING di environment > .env
if [[ -z "${DB_URL:-}" ]]; then
  if [[ -z "${SUPABASE_CONNECTION_STRING:-}" && -f "$REPO_DIR/.env" ]]; then
    SUPABASE_CONNECTION_STRING="$(grep -E '^SUPABASE_CONNECTION_STRING=' "$REPO_DIR/.env" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')"
  fi
  DB_URL="${SUPABASE_CONNECTION_STRING:-}"
  # Template dashboard Supabase: "...:[YOUR-PASSWORD]@...". Kurung siku yang
  # tertinggal di sekitar password ikut terkirim dan login ditolak, jadi
  # dibuang di sini; placeholder yang belum diganti diisi SUPABASE_PROJECT_PASSWORD.
  if [[ -z "${SUPABASE_PROJECT_PASSWORD:-}" && -f "$REPO_DIR/.env" ]]; then
    SUPABASE_PROJECT_PASSWORD="$(grep -E '^SUPABASE_PROJECT_PASSWORD=' "$REPO_DIR/.env" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')"
  fi
  DB_URL="$(PROJECT_PW="${SUPABASE_PROJECT_PASSWORD:-}" python3 -c '
import os, re, sys, urllib.parse
url, fallback = sys.argv[1], os.environ.get("PROJECT_PW", "")
m = re.match(r"^(postgres(?:ql)?://[^:/@]+:)(.*)(@[^@]+)$", url)
if m:
    pw = m.group(2)
    if pw.startswith("[") and pw.endswith("]"):
        pw = pw[1:-1]
    if pw == "YOUR-PASSWORD" and fallback:
        pw = fallback
    if pw and "%" not in pw:
        pw = urllib.parse.quote(pw, safe="")
    url = m.group(1) + pw + m.group(3)
print(url)
' "$DB_URL")"
fi
if [[ -z "$DB_URL" ]]; then
  echo "GAGAL: isi SUPABASE_CONNECTION_STRING di .env atau jalankan dengan DB_URL=..." >&2
  exit 1
fi

# pg_dump harus versi >= versi server Supabase (15/17). Pakai yang terbaru.
PG_BIN=""
for v in 17 16 15; do
  for d in "/opt/homebrew/opt/postgresql@$v/bin" "/usr/local/opt/postgresql@$v/bin" "/usr/lib/postgresql/$v/bin"; do
    if [[ -x "$d/pg_dump" ]]; then PG_BIN="$d/"; break 2; fi
  done
done
PG_DUMP="${PG_BIN}pg_dump"
PG_RESTORE="${PG_BIN}pg_restore"
PSQL="${PG_BIN}psql"
command -v "$PG_DUMP" >/dev/null || { echo "GAGAL: pg_dump tidak ditemukan (brew install postgresql@17)" >&2; exit 1; }

echo "pg_dump : $("$PG_DUMP" --version)"
echo "tujuan  : $OUT_DIR"

# Cek koneksi dulu, supaya pesan errornya jelas.
CONN_ERR="$(mktemp)"
if ! "$PSQL" "$DB_URL" -tAc 'select 1' >/dev/null 2>"$CONN_ERR" ; then
  echo "GAGAL konek ke database:" >&2
  cat "$CONN_ERR" >&2; rm -f "$CONN_ERR"
  echo >&2
  echo "Kalau errornya soal host / DNS: host db.<ref>.supabase.co hanya IPv6." >&2
  echo "Pakai Session Pooler (Supabase > Connect > Session pooler) lewat DB_URL=..." >&2
  exit 1
fi
rm -f "$CONN_ERR"

umask 077
mkdir -p "$OUT_DIR"

echo "1/4 public (custom)…";  "$PG_DUMP" "$DB_URL" --schema=public --format=custom --file="$OUT_DIR/public.dump"
echo "2/4 public (sql)…";     "$PG_DUMP" "$DB_URL" --schema=public --format=plain  --file="$OUT_DIR/public.sql"
echo "3/4 auth (data)…";      "$PG_DUMP" "$DB_URL" --schema=auth    --data-only --format=custom --file="$OUT_DIR/auth_data.dump"
echo "4/4 storage (data)…";   "$PG_DUMP" "$DB_URL" --schema=storage --data-only --format=custom --file="$OUT_DIR/storage_data.dump"

# Verifikasi: setiap dump harus bisa dibaca pg_restore, dan isinya tidak kosong.
for f in public.dump auth_data.dump storage_data.dump; do
  entries="$("$PG_RESTORE" --list "$OUT_DIR/$f" | grep -vc '^;')"
  echo "  ok  $f ($entries entri)"
done
grep -q 'CREATE TABLE public.profiles' "$OUT_DIR/public.sql" || { echo "GAGAL: public.sql tidak berisi tabel profiles" >&2; exit 1; }

# Ringkasan jumlah baris, untuk dibandingkan setelah migration / hapus dummy.
"$PSQL" "$DB_URL" -tA -F' ' -c "
  select 'auth.users', count(*) from auth.users
  union all select 'profiles', count(*) from public.profiles
  union all select 'jobs', count(*) from public.jobs
  union all select 'projects', count(*) from public.projects
  union all select 'courses', count(*) from public.courses
  union all select 'events', count(*) from public.events" > "$OUT_DIR/row_counts.txt"

echo
echo "Selesai. Jumlah baris saat backup:"
sed 's/^/  /' "$OUT_DIR/row_counts.txt"
du -sh "$OUT_DIR" | awk '{print "Ukuran: " $1}'
