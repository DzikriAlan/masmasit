#!/usr/bin/env node
// =========================================================================
// SCRIPT 8 - BERSIHKAN FILE YATIM DI STORAGE (avatars, company-logos)
// =========================================================================
// File "yatim" = gambar di Storage yang tidak dipakai lagi oleh profil,
// perusahaan, atau agency mana pun. Dulu setiap ganti avatar/logo membuat
// file baru ({uid}/{timestamp}.jpg) dan file lama tidak pernah dihapus.
//
//   node supabase/run/08_BERSIHKAN_FILE_YATIM.mjs           # pratinjau, tidak menghapus
//   node supabase/run/08_BERSIHKAN_FILE_YATIM.mjs --apply   # hapus file yatim
//
// Butuh di .env (atau environment):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (Supabase > Project Settings > API > service_role)
// Supabase melarang hapus file lewat SQL, jadi penghapusan lewat Storage API.
//
// Aman:
//   - Hanya bucket avatars dan company-logos. Bucket lain tidak disentuh.
//   - File dianggap dipakai kalau path-nya muncul di profiles.avatar_url,
//     companies.logo_url, atau agencies.logo_url (dengan atau tanpa ?v=...).
//   - File yang diunggah < 24 jam terakhir dilewati (bisa jadi form belum disimpan).
//   - Jalankan 00_BACKUP.sh dulu; daftar yang dihapus dicetak ke layar.
// =========================================================================
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const envFile = join(root, '.env');
const fileEnv = {};
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) fileEnv[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
}
const env = (k) => process.env[k] || fileEnv[k];

const url = env('NEXT_PUBLIC_SUPABASE_URL');
const key = env('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !key) {
  console.error('GAGAL: isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env');
  process.exit(1);
}
const apply = process.argv.includes('--apply');
const supabase = createClient(url, key, { auth: { persistSession: false } });

const BUCKETS = ['avatars', 'company-logos'];
const GRACE_MS = 24 * 60 * 60 * 1000;

const fetchAll = async (table, column) => {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(column).not(column, 'is', null).range(from, from + 999);
    if (error) {
      // Tabel yang belum ada (mis. agencies di DB lama) cukup dilewati.
      if (error.code === '42P01' || error.code === 'PGRST205') return out;
      throw new Error(`${table}.${column}: ${error.message}`);
    }
    out.push(...data.map((r) => r[column]));
    if (data.length < 1000) return out;
  }
};

const listBucket = async (bucket) => {
  const files = [];
  const { data: folders, error } = await supabase.storage.from(bucket).list('', { limit: 1000 });
  if (error) throw new Error(`${bucket}: ${error.message}`);
  for (const folder of folders) {
    if (folder.id) {
      files.push({ path: folder.name, ...folder });
      continue;
    }
    const { data: inner, error: e2 } = await supabase.storage.from(bucket).list(folder.name, { limit: 1000 });
    if (e2) throw new Error(`${bucket}/${folder.name}: ${e2.message}`);
    for (const f of inner) if (f.id) files.push({ path: `${folder.name}/${f.name}`, ...f });
  }
  return files;
};

const refs = [
  ...(await fetchAll('profiles', 'avatar_url')),
  ...(await fetchAll('companies', 'logo_url')),
  ...(await fetchAll('agencies', 'logo_url')),
].join('\n');

let totalBytes = 0;
let totalFiles = 0;
for (const bucket of BUCKETS) {
  const files = await listBucket(bucket);
  const orphans = files.filter((f) => {
    const used = refs.includes(`/${bucket}/${f.path}`);
    const fresh = Date.now() - new Date(f.created_at).getTime() < GRACE_MS;
    return !used && !fresh;
  });
  const bytes = orphans.reduce((n, f) => n + (f.metadata?.size ?? 0), 0);
  console.log(`\n${bucket}: ${files.length} file, ${orphans.length} yatim (${(bytes / 1024).toFixed(0)} KB)`);
  for (const f of orphans) console.log(`  - ${f.path}  ${((f.metadata?.size ?? 0) / 1024).toFixed(0)} KB`);

  if (apply && orphans.length) {
    for (let i = 0; i < orphans.length; i += 100) {
      const batch = orphans.slice(i, i + 100).map((f) => f.path);
      const { error } = await supabase.storage.from(bucket).remove(batch);
      if (error) throw new Error(`hapus ${bucket}: ${error.message}`);
    }
    console.log(`  terhapus ${orphans.length} file`);
  }
  totalBytes += bytes;
  totalFiles += orphans.length;
}

console.log(`\n${apply ? 'SELESAI' : 'PRATINJAU (tidak ada yang dihapus)'}: ${totalFiles} file yatim, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
if (!apply && totalFiles) console.log('Jalankan lagi dengan --apply untuk menghapus.');
