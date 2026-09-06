'use client';

import { AppShell } from '@/components/app-shell';
import { useLang } from '@/components/language-provider';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const { t } = useLang();
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">{t('Privacy Policy', 'Kebijakan Privasi')}</h1>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('Data We Collect', 'Data Yang Kami Kumpulkan')}</h2>
            <p>{t('We collect your name, email, location, professional information (job status, LinkedIn, WhatsApp, Calendly), and any content you post (job listings, projects, courses, messages). We also store payment notes you submit — but not payment card details. All payments are processed externally via Lynk.id.', 'Kami mengumpulkan nama, email, lokasi, informasi profesional (status pekerjaan, LinkedIn, WhatsApp, Calendly), dan konten yang Anda posting (lowongan, proyek, kursus, pesan). Kami juga menyimpan catatan pembayaran yang Anda kirim — tetapi bukan detail kartu pembayaran. Semua pembayaran diproses eksternal melalui Lynk.id.')}</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('How We Use Your Data', 'Cara Kami Menggunakan Data Anda')}</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>{t('To display your profile to other community members', 'Menampilkan profil Anda kepada member komunitas lain')}</li>
              <li>{t('To connect you with jobs, projects, and bookings', 'Menghubungkan Anda dengan lowongan, proyek, dan booking')}</li>
              <li>{t('To send notifications about messages and status updates', 'Mengirim notifikasi tentang pesan dan pembaruan status')}</li>
              <li>{t('To verify payments submitted through Lynk.id', 'Memverifikasi pembayaran yang dikirim melalui Lynk.id')}</li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('Payments', 'Pembayaran')}</h2>
            <p>{t('All payments on this platform are processed externally through Lynk.id. We do not store, process, or transmit any payment card information. When you click "Pay via Lynk.id", you are redirected to Lynk.id\'s secure payment page. We only receive a confirmation note (which you optionally submit) to verify your payment.', 'Semua pembayaran di platform ini diproses eksternal melalui Lynk.id. Kami tidak menyimpan, memproses, atau mengirimkan informasi kartu pembayaran. Saat Anda mengklik "Bayar via Lynk.id", Anda diarahkan ke halaman pembayaran aman Lynk.id. Kami hanya menerima catatan konfirmasi (yang Anda kirim secara opsional) untuk memverifikasi pembayaran Anda.')}</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('Data Retention', 'Penyimpanan Data')}</h2>
            <p>{t('Your data is retained as long as your account is active. You may request deletion of your account and associated data by contacting us.', 'Data Anda disimpan selama akun Anda aktif. Anda dapat meminta penghapusan akun dan data terkait dengan menghubungi kami.')}</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('Contact', 'Kontak')}</h2>
            <p>{t('For privacy concerns, contact us at hello@masmasit.online', 'Untuk masalah privasi, hubungi kami di hello@masmasit.online')}</p>
          </section>
          <p className="text-xs text-muted-foreground/60 pt-4">Last updated: {new Date().getFullYear()}</p>
        </div>
      </div>
    </AppShell>
  );
}
