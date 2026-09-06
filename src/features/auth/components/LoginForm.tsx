'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Code2, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { getCurrentUser, getProfileNameBio } from '@/features/auth/services/authServices';
import { GoogleGlyph } from '@/features/auth/components/GoogleGlyph';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setGoogleLoading(false);
      toast.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(t('Welcome back!', 'Selamat datang kembali!'));
      const { data: p } = await getProfileNameBio((await getCurrentUser()).data.user?.id ?? '');
      router.push(p?.full_name ? '/dashboard' : '/onboarding');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <Card className="relative w-full max-w-md glass">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Code2 className="h-5 w-5 text-white" />
            </div>
          </Link>
          <CardTitle className="font-display text-2xl">{t('Welcome Back', 'Selamat Datang Kembali')}</CardTitle>
          <CardDescription>{t('Sign in to your masmasit.online account', 'Masuk ke akun masmasit.online Anda')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogle} disabled={googleLoading || loading}>
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleGlyph />}
            {t('Continue with Google', 'Lanjut dengan Google')}
          </Button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{t('or', 'atau')}</span></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
            <div className="flex items-center justify-between">
              <span />
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                {t('Forgot password?', 'Lupa kata sandi?')}
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('Sign In', 'Masuk')}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("Don't have an account?", 'Belum punya akun?')}{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              {t('Sign up', 'Daftar')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
