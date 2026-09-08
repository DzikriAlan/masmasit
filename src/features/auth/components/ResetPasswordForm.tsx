'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useLang } from '@/components/language-provider';
import { getSession, updateUserPassword } from '@/features/auth/services/authServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const { t } = useLang();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSession().then(() => setReady(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t('Password must be at least 6 characters', 'Kata sandi minimal 6 karakter'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('Passwords do not match', 'Kata sandi tidak cocok'));
      return;
    }
    setLoading(true);
    const { error } = await updateUserPassword(password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('Password updated! Please sign in.', 'Kata sandi diperbarui! Silakan masuk.'));
      router.push('/login');
    }
  };

  if (!ready) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

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
          <CardTitle className="font-display text-2xl">{t('Reset Password', 'Reset Kata Sandi')}</CardTitle>
          <CardDescription>{t('Enter your new password below.', 'Masukkan kata sandi baru Anda di bawah.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('New Password', 'Kata Sandi Baru')}</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t('Confirm Password', 'Konfirmasi Kata Sandi')}</Label>
              <Input id="confirm" type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('Update Password', 'Perbarui Kata Sandi')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
