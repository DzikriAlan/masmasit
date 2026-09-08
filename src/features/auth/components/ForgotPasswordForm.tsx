'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { useLang } from '@/components/language-provider';
import { postPasswordResetEmail } from '@/features/auth/services/authServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await postPasswordResetEmail(email, `${window.location.origin}/reset-password`);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success(t('Reset link sent! Check your email.', 'Link reset dikirim! Cek email Anda.'));
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <Card className="relative w-full max-w-md glass">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
            <img
              src="/icon-192.webp"
              alt="masmasit.online"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-[24%]"
            />
          </Link>
          <CardTitle className="font-display text-2xl">{t('Forgot Password', 'Lupa Kata Sandi')}</CardTitle>
          <CardDescription>{t('Enter your email and we\'ll send you a reset link.', 'Masukkan email Anda dan kami akan mengirim link reset.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <Mail className="mx-auto h-12 w-12 text-primary" />
              <p className="text-sm text-muted-foreground">{t('We\'ve sent a password reset link to your email. Check your inbox and follow the instructions.', 'Kami telah mengirim link reset kata sandi ke email Anda. Cek kotak masuk dan ikuti instruksinya.')}</p>
              <Link href="/login"><Button className="w-full">{t('Back to Login', 'Kembali ke Login')}</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('Email', 'Email')}</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('Send Reset Link', 'Kirim Link Reset')}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">{t('Back to login', 'Kembali ke login')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
