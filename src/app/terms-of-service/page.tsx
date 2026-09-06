'use client';

import { AppShell } from '@/components/app-shell';
import { useLang } from '@/components/language-provider';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  const { t } = useLang();
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">{t('Terms of Service', 'Ketentuan Layanan')}</h1>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('Acceptance', 'Penerimaan')}</h2>
            <p>{t('By creating an account and using masmasit.online, you agree to these terms. If you do not agree, please do not use the platform.', 'Dengan membuat akun dan menggunakan masmasit.online, Anda menyetujui ketentuan ini. Jika Anda tidak setuju, mohon jangan gunakan platform ini.')}</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('User Responsibilities', 'Tanggung Jawab Pengguna')}</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>{t('Provide accurate information in your profile and listings', 'Berikan informasi yang akurat di profil dan listing Anda')}</li>
              <li>{t('Do not post misleading, offensive, or illegal content', 'Jangan posting konten yang menyesatkan, menyinggung, atau ilegal')}</li>
              <li>{t('Respect other members — no harassment, spam, or abuse', 'Hormati member lain — tanpa pelecehan, spam, atau penyalahgunaan')}</li>
              <li>{t('Complete bookings and projects you commit to', 'Selesaikan booking dan proyek yang Anda komitmeni')}</li>
              <li>{t('Do not attempt to circumvent payment through Lynk.id', 'Jangan mencoba menghindari pembayaran melalui Lynk.id')}</li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('Payments via Lynk.id', 'Pembayaran via Lynk.id')}</h2>
            <p>{t('All payments for bookings, courses, events, and agency projects are processed externally through Lynk.id. masmasit.online does not handle payment card data. After completing payment on Lynk.id, you must submit a confirmation note so the admin can verify your payment and mark it as paid.', 'Semua pembayaran untuk booking, kursus, event, dan proyek agency diproses eksternal melalui Lynk.id. masmasit.online tidak menangani data kartu pembayaran. Setelah menyelesaikan pembayaran di Lynk.id, Anda harus mengirim catatan konfirmasi agar admin dapat memverifikasi pembayaran Anda dan menandainya sebagai lunas.')}</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('Disputes & Refunds', 'Sengketa & Pengembalian Dana')}</h2>
            <p>{t('If you have a dispute about a payment, booking, or project, contact us at hello@masmasit.online. Refunds are handled case-by-case. Since payments are processed via Lynk.id, refund requests may need to be initiated through Lynk.id as well.', 'Jika Anda memiliki sengketa tentang pembayaran, booking, atau proyek, hubungi kami di hello@masmasit.online. Pengembalian dana ditangani sesuai kasus. Karena pembayaran diproses melalui Lynk.id, permintaan pengembalian dana mungkin perlu diinisiasi melalui Lynk.id juga.')}</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('Account Termination', 'Penghentian Akun')}</h2>
            <p>{t('We reserve the right to suspend or terminate accounts that violate these terms, post inappropriate content, or engage in fraudulent payment activity.', 'Kami berhak menangguhkan atau menghentikan akun yang melanggar ketentuan ini, posting konten tidak pantas, atau terlibat dalam aktivitas pembayaran curang.')}</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">{t('Contact', 'Kontak')}</h2>
            <p>{t('For any questions about these terms, contact us at hello@masmasit.online', 'Untuk pertanyaan tentang ketentuan ini, hubungi kami di hello@masmasit.online')}</p>
          </section>
          <p className="text-xs text-muted-foreground/60 pt-4">Last updated: {new Date().getFullYear()}</p>
        </div>
      </div>
    </AppShell>
  );
}
