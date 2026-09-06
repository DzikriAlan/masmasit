'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, Clock, Loader2, Send, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ProjectDetail {
  id: string;
  user_id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

interface BidWithUser {
  id: string;
  amount: number;
  proposal: string;
  eta_days: number | null;
  status: string;
  user_id: string;
  profiles: { full_name: string | null } | null;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [bids, setBids] = useState<BidWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBid, setShowBid] = useState(false);
  const [bidForm, setBidForm] = useState({ amount: '', proposal: '', eta_days: '' });
  const [saving, setSaving] = useState(false);
  const [confirmBidId, setConfirmBidId] = useState<string | null>(null);
  const [hasBid, setHasBid] = useState(false);

  useEffect(() => {
    (async () => {
      const id = params.id as string;
      const { data: p } = await supabase
        .from('projects')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .maybeSingle();
      setProject(p as ProjectDetail | null);

      const { data: b } = await supabase
        .from('project_bids')
        .select('*, profiles(full_name)')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      setBids((b as BidWithUser[]) ?? []);

      if (user) {
        setHasBid((b ?? []).some((bid) => bid.user_id === user.id));
      }
      setLoading(false);
    })();
  }, [params, user]);

  const handleBid = async () => {
    if (!user) { router.push('/login'); return; }
    setSaving(true);
    const { error } = await supabase.from('project_bids').insert({
      project_id: project!.id,
      user_id: user.id,
      amount: parseInt(bidForm.amount),
      proposal: bidForm.proposal,
      eta_days: bidForm.eta_days ? parseInt(bidForm.eta_days) : null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? t('You already bid on this project', 'Anda sudah mengajukan bid untuk proyek ini') : t('Failed to submit bid', 'Gagal mengajukan bid'));
    } else {
      toast.success(t('Bid submitted!', 'Bid terkirim!'));
      setShowBid(false);
      setHasBid(true);
      const { data: b } = await supabase.from('project_bids').select('*, profiles(full_name)').eq('project_id', project!.id).order('created_at', { ascending: false });
      setBids((b as BidWithUser[]) ?? []);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!user || user.id !== project!.user_id) {
      toast.error(t('Not authorized', 'Tidak memiliki izin'));
      return;
    }
    setConfirmBidId(null);
    setSaving(true);
    const { error: err1 } = await supabase.from('project_bids').update({ status: 'accepted' }).eq('id', bidId);
    if (err1) {
      setSaving(false);
      toast.error(t('Failed to accept bid', 'Gagal menerima bid'));
      return;
    }
    const { error: err2 } = await supabase.from('project_bids').update({ status: 'rejected' }).neq('id', bidId).eq('project_id', project!.id);
    if (err2) {
      setSaving(false);
      toast.error(t('Failed to reject other bids', 'Gagal menolak bid lain'));
      return;
    }
    const { error: err3 } = await supabase.from('projects').update({ status: 'in_progress' }).eq('id', project!.id);
    setSaving(false);
    if (err3) {
      toast.error(t('Failed to update project status', 'Gagal memperbarui status proyek'));
      return;
    }
    toast.success(t('Bid accepted! Project is now in progress.', 'Bid diterima! Proyek sekarang berjalan.'));
    const { data: b } = await supabase.from('project_bids').select('*, profiles(full_name)').eq('project_id', project!.id).order('created_at', { ascending: false });
    setBids((b as BidWithUser[]) ?? []);
    setProject({ ...project!, status: 'in_progress' });
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
                <Button onClick={handleBid} disabled={saving || !bidForm.amount || !bidForm.proposal} className="gap-2">
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
              <Button className="flex-1" onClick={() => handleAcceptBid(confirmBidId)} disabled={saving}>
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
