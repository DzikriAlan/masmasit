'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { GoogleGlyph } from '@/features/auth/components/GoogleGlyph';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function RegisterForm() {
  const { signUp, signInWithGoogle } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const saveGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setGoogleLoading(false);
      toast.error(error);
    }
  };

  const saveRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t('Password must be at least 6 characters', 'Kata sandi minimal 6 karakter'));
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(t('Account created! Please check your email to verify.', 'Akun dibuat! Silakan cek email untuk verifikasi.'));
      setRegistered(true);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
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
          <CardTitle className="font-display text-2xl">{t('Join the Ecosystem', 'Gabung Ekosistem')}</CardTitle>
          <CardDescription>{t('Create your masmasit.online account', 'Buat akun masmasit.online Anda')}</CardDescription>
        </CardHeader>
        <CardContent>
          {registered ? (
            <div className="text-center space-y-4 py-4">
              <Mail className="mx-auto h-12 w-12 text-primary" />
              <p className="text-sm text-muted-foreground">{t('We\'ve sent a verification link to your email. Click the link to activate your account, then sign in.', 'Kami telah mengirim link verifikasi ke email Anda. Klik link untuk mengaktifkan akun, lalu masuk.')}</p>
              <Link href="/login"><Button className="w-full">{t('Go to Login', 'Ke Login')}</Button></Link>
            </div>
          ) : (
          <>
          <Button type="button" variant="outline" className="w-full gap-2" onClick={saveGoogleSignIn} disabled={googleLoading || loading}>
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleGlyph />}
            {t('Continue with Google', 'Lanjut dengan Google')}
          </Button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{t('or', 'atau')}</span></div>
          </div>
          <form onSubmit={saveRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('Full Name', 'Nama Lengkap')}</Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Budi Santoso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('Email', 'Email')}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('Password', 'Kata Sandi')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('Create Account', 'Buat Akun')}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {t('By signing up you agree to our', 'Dengan mendaftar Anda menyetujui')}{' '}
              <Link href="/terms-of-service" className="text-primary hover:underline">{t('Terms', 'Ketentuan')}</Link>{' & '}
              <Link href="/privacy-policy" className="text-primary hover:underline">{t('Privacy Policy', 'Kebijakan Privasi')}</Link>
            </p>
          </form>
          </>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('Already have an account?', 'Sudah punya akun?')}{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t('Sign in', 'Masuk')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
