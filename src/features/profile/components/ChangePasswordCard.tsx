'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthControllers } from '@/features/auth/controllers/authControllers';
import { friendlyError } from '@/shared/lib/friendlyError';

const MIN_PASSWORD_LENGTH = 6;

export default function ChangePasswordCard() {
  const { user, signIn } = useAuth();
  const { t } = useLang();
  const { changeAuthPassword } = useAuthControllers();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // app_metadata also covers accounts created by SQL seeds, which may have no identity rows.
  const hasPassword =
    user?.app_metadata?.provider === 'email' ||
    (user?.app_metadata?.providers as string[] | undefined)?.includes('email') ||
    user?.identities?.some((identity) => identity.provider === 'email') ||
    false;

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(t('New password must be at least 6 characters', 'Kata sandi baru minimal 6 karakter'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('New passwords do not match', 'Kata sandi baru tidak cocok'));
      return;
    }

    setSaving(true);
    // updateUser only needs a session, so an open session alone must not be
    // enough to take over the account: check the current password first.
    const { error: signInError } = await signIn(user?.email ?? '', currentPassword);
    if (signInError) {
      setSaving(false);
      toast.error(
        /invalid login credentials/i.test(signInError)
          ? t('Your current password is incorrect.', 'Kata sandi saat ini salah.')
          : friendlyError(signInError, t, t('Could not verify your password. Please try again.', 'Kata sandi gagal diverifikasi. Silakan coba lagi.'))
      );
      return;
    }

    try {
      await changeAuthPassword.mutateAsync({ password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('Password updated.', 'Kata sandi diperbarui.'));
    } catch (error) {
      toast.error(friendlyError(error, t, t('Could not update your password. Please try again.', 'Kata sandi gagal diperbarui. Silakan coba lagi.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass mb-6">
      <CardHeader>
        <CardTitle>{t('Change Password', 'Ganti Kata Sandi')}</CardTitle>
        <CardDescription>
          {hasPassword
            ? t('Enter your current password to set a new one.', 'Masukkan kata sandi saat ini untuk membuat yang baru.')
            : t('You sign in with Google, so this account has no password here.', 'Anda masuk dengan Google, jadi akun ini belum punya kata sandi di sini.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasPassword ? (
          <form onSubmit={savePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('Current password', 'Kata sandi saat ini')}</Label>
              <Input
                id="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('New password', 'Kata sandi baru')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">{t('Confirm new password', 'Ulangi kata sandi baru')}</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('Change Password', 'Ganti Kata Sandi')}
              </Button>
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                {t('Forgot your password?', 'Lupa kata sandi?')}
              </Link>
            </div>
          </form>
        ) : (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/forgot-password">{t('Set a password by email', 'Buat kata sandi lewat email')}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
