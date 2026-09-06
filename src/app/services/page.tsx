'use client';

import { useEffect, useState } from 'react';
import { Code2, Brain, Palette, UsersRound, Loader2, ArrowRight, Send } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const categoryIcons: Record<string, any> = { 'SaaS': Code2, 'AI Solutions': Brain, 'Creative Services': Palette, 'HR Solutions': UsersRound };

interface Service {
  id: string;
  category: string;
  title: string;
  description: string;
  base_price: number | null;
  is_active: boolean;
}

export default function ServicesPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [form, setForm] = useState({ client_name: '', client_email: '', client_company: '', scope: '', budget: '' });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('agency_services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });
      setServices((data as Service[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const categories = Array.from(new Set(services.map((s) => s.category)));

  const handleSubmit = async () => {
    setSaving(true);
    const { error } = await supabase.from('agency_projects').insert({
      client_name: form.client_name,
      client_email: form.client_email,
      client_company: form.client_company || null,
      service_id: selectedService,
      scope: form.scope,
      budget: form.budget ? parseInt(form.budget) : null,
    });
    setSaving(false);
    if (error) { toast.error(t('Failed to submit request', 'Gagal mengirim permintaan')); return; }
    toast.success(t('Project request submitted! We\'ll contact you soon.', 'Permintaan proyek terkirim! Kami akan menghubungi Anda segera.'));
    setSubmitted(true);
    setSelectedService(null);
    setForm({ client_name: '', client_email: '', client_company: '', scope: '', budget: '' });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">{t('Agency Services', 'Layanan Agency')}</h1>
          <p className="mt-1 text-muted-foreground">{t('End-to-end digital solutions delivered by our expert team — from MVP to enterprise scale.', 'Solusi digital end-to-end oleh tim ahli kami — dari MVP hingga skala enterprise.')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-10">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat] ?? Code2;
              return (
                <div key={cat}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                    <h2 className="font-display text-xl font-bold">{cat}</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {services.filter((s) => s.category === cat).map((s) => (
                      <Card key={s.id} className="glass group transition-all hover:border-primary/40 hover:-translate-y-0.5">
                        <CardContent className="p-5">
                          <h3 className="font-semibold">{s.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                          {s.base_price && <p className="mt-3 text-sm font-medium text-primary">{t('From', 'Mulai')} Rp {(s.base_price / 1000000).toFixed(0)}M</p>}
                          <Button size="sm" variant="outline" className="mt-3 w-full gap-2" onClick={() => setSelectedService(s.id)}>
                            {t('Request Project', 'Minta Proyek')} <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Request modal */}
        {selectedService && !submitted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedService(null)}>
            <Card className="glass w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <CardHeader><CardTitle>{t('Request a Project', 'Minta Proyek')}</CardTitle><CardDescription>{t('Tell us about your project scope and we\'ll get back to you.', 'Ceritakan scope proyek Anda dan kami akan menghubungi Anda.')}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="rn">{t('Your Name', 'Nama Anda')}</Label><Input id="rn" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="John Doe" /></div>
                  <div className="space-y-2"><Label htmlFor="re">{t('Email', 'Email')}</Label><Input id="re" type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} placeholder="john@company.com" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="rc">{t('Company (optional)', 'Perusahaan (opsional)')}</Label><Input id="rc" value={form.client_company} onChange={(e) => setForm({ ...form, client_company: e.target.value })} placeholder={t('Company name', 'Nama perusahaan')} /></div>
                <div className="space-y-2"><Label htmlFor="rs">{t('Project Scope', 'Scope Proyek')}</Label><Textarea id="rs" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder={t('Describe what you need...', 'Jelaskan kebutuhan Anda...')} className="min-h-[100px]" /></div>
                <div className="space-y-2"><Label htmlFor="rb">{t('Budget (IDR, optional)', 'Budget (IDR, opsional)')}</Label><Input id="rb" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="50000000" /></div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedService(null)}>{t('Cancel', 'Batal')}</Button>
                  <Button onClick={handleSubmit} disabled={saving || !form.client_name || !form.client_email || !form.scope} className="gap-2 flex-1">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {t('Submit Request', 'Kirim Permintaan')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {submitted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSubmitted(false)}>
            <Card className="glass w-full max-w-md text-center">
              <CardContent className="p-8">
                <h2 className="font-display text-xl font-bold">{t('Request Submitted!', 'Permintaan Terkirim!')}</h2>
                <p className="mt-2 text-muted-foreground">{t('Our team will review your request and contact you within 2 business days with a DP payment link via Lynk.id.', 'Tim kami akan meninjau permintaan Anda dan menghubungi dalam 2 hari kerja dengan link pembayaran DP via Lynk.id.')}</p>
                <Button onClick={() => setSubmitted(false)} className="mt-4">{t('Close', 'Tutup')}</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
