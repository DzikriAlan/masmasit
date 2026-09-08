'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, Clock, Loader2, Send, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { API_ERROR_CODE } from '@/shared/lib/apiResponse';
import { useProjectsDetailControllers } from '@/features/projects/controllers/projectsControllers';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();
  const [showBid, setShowBid] = useState(false);
  const [bidForm, setBidForm] = useState({ amount: '', proposal: '', eta_days: '' });
  const [confirmBidId, setConfirmBidId] = useState<string | null>(null);

  const {
    fetchProjectsDetail,
    fetchProjectsBids,
    storeProjectsBid,
    storeProjectsBidAccepted,
    changeProjectsStatus,
  } = useProjectsDetailControllers(params.id as string);

  const project = fetchProjectsDetail.data ?? null;
  const bids = fetchProjectsBids.data ?? [];
  const loading = fetchProjectsDetail.isPending;
  const saving =
    storeProjectsBid.isPending ||
    storeProjectsBidAccepted.isPending ||
    changeProjectsStatus.isPending;
  const hasBid = Boolean(user) && bids.some((bid) => bid.user_id === user?.id);

  const saveBid = async () => {
    if (!user || !project) { router.push('/login'); return; }
    try {
      await storeProjectsBid.mutateAsync({
        project_id: project.id,
        user_id: user.id,
        amount: parseInt(bidForm.amount),
        proposal: bidForm.proposal,
        eta_days: bidForm.eta_days ? parseInt(bidForm.eta_days) : null,
      });
    } catch (error) {
      const code = error instanceof Error ? error.name : '';
      toast.error(
        code === API_ERROR_CODE.CONFLICT
          ? t('You already bid on this project', 'Anda sudah mengajukan bid untuk proyek ini')
          : t('Failed to submit bid', 'Gagal mengajukan bid')
      );
      return;
    }
    toast.success(t('Bid submitted!', 'Bid terkirim!'));
    setShowBid(false);
  };

  const saveAcceptedBid = async (bidId: string) => {
    if (!user || !project || user.id !== project.user_id) {
      toast.error(t('Not authorized', 'Tidak memiliki izin'));
      return;
    }
    setConfirmBidId(null);
    try {
      await storeProjectsBidAccepted.mutateAsync(bidId);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t('Failed to accept bid', 'Gagal menerima bid')
      );
      return;
    }
    toast.success(t('Bid accepted! Project is now in progress.', 'Bid diterima! Proyek sekarang berjalan.'));
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;
  if (!project) return <AppShell><div className="py-20 text-center text-muted-foreground">{t('Project not found.', 'Proyek tidak ditemukan.')}</div></AppShell>;

  const isOwner = user?.id === project.user_id;
  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return t('Negotiable', 'Negosiasi');
    if (min && max) return `Rp ${(min / 1000000).toFixed(1)}-${(max / 1000000).toFixed(1)}M`;
    if (min) return `Rp ${(min / 1000000).toFixed(1)}M+`;
    return `Up to Rp ${(max! / 1000000).toFixed(1)}M`;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2"><ArrowLeft className="h-4 w-4" /> {t('Back', 'Kembali')}</Button>

        <Card className="glass mb-6">
          <CardContent className="p-6 sm:p-8">
            <Badge variant={project.status === 'open' ? 'default' : 'secondary'} className="mb-3 capitalize">{project.status.replace('_', ' ')}</Badge>
            <h1 className="font-display text-2xl font-bold">{project.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('by', 'oleh')} {project.profiles?.full_name ?? 'Anonymous'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1"><Wallet className="h-3 w-3" /> {formatBudget(project.budget_min, project.budget_max)}</Badge>
              {project.deadline && <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> {new Date(project.deadline).toLocaleDateString('id-ID')}</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card className="glass mb-6">
          <CardHeader><CardTitle>{t('Description', 'Deskripsi')}</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm leading-relaxed">{project.description}</p></CardContent>
        </Card>

        {/* Bid section */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t('Bids', 'Bid')} ({bids.length})
              {!isOwner && project.status === 'open' && !hasBid && (
                <Button size="sm" onClick={() => setShowBid(!showBid)} className="gap-2"><Send className="h-3.5 w-3.5" /> {t('Place Bid', 'Ajukan Bid')}</Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showBid && (
              <div className="mb-4 space-y-3 rounded-lg border border-border/60 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="bamount">{t('Your Bid (IDR)', 'Bid Anda (IDR)')}</Label><Input id="bamount" type="number" value={bidForm.amount} onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })} placeholder="5000000" /></div>
                  <div className="space-y-2"><Label htmlFor="beta">{t('ETA (days)', 'Estimasi (hari)')}</Label><Input id="beta" type="number" value={bidForm.eta_days} onChange={(e) => setBidForm({ ...bidForm, eta_days: e.target.value })} placeholder="14" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="bprop">{t('Proposal', 'Proposal')}</Label><Textarea id="bprop" value={bidForm.proposal} onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })} placeholder={t('Why are you the best fit?', 'Mengapa Anda paling cocok?')} /></div>
                <Button onClick={saveBid} disabled={saving || !bidForm.amount || !bidForm.proposal} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('Submit Bid', 'Kirim Bid')}
                </Button>
              </div>
            )}

            {bids.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No bids yet.', 'Belum ada bid.')}</p>
            ) : (
              <div className="space-y-3">
                {bids.map((bid) => (
                  <div key={bid.id} className={`rounded-lg border p-4 ${bid.status === 'accepted' ? 'border-success/40 bg-success/5' : 'border-border/60'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{bid.profiles?.full_name ?? 'Anonymous'}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{bid.proposal}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">Rp {(bid.amount / 1000000).toFixed(1)}M</p>
                        {bid.eta_days && <p className="text-xs text-muted-foreground">{bid.eta_days} days</p>}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {bid.status === 'accepted' && <Badge variant="default" className="gap-1 text-xs"><CheckCircle2 className="h-3 w-3" /> {t('Accepted', 'Diterima')}</Badge>}
                      {bid.status === 'rejected' && <Badge variant="secondary" className="gap-1 text-xs"><XCircle className="h-3 w-3" /> {t('Rejected', 'Ditolak')}</Badge>}
                      {bid.status === 'pending' && isOwner && project.status === 'open' && (
                        <Button size="sm" onClick={() => setConfirmBidId(bid.id)} disabled={saving}>{t('Accept', 'Terima')}</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation dialog */}
      {confirmBidId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-up" onClick={() => setConfirmBidId(null)}>
          <div className="mx-4 max-w-sm rounded-xl border border-border/60 bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">{t('Accept this bid?', 'Terima bid ini?')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t('This will reject all other bids and start the project. This action cannot be undone.', 'Ini akan menolak semua bid lain dan memulai proyek. Tindakan ini tidak bisa dibatalkan.')}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmBidId(null)}>{t('Cancel', 'Batal')}</Button>
              <Button className="flex-1" onClick={() => saveAcceptedBid(confirmBidId)} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('Confirm', 'Konfirmasi')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
