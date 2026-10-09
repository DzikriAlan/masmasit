'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Briefcase, GraduationCap, Star, Users2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import type { DataProfileApproval } from '@/features/profile/types/profileTypes';

type WithdrawRole = 'talent' | 'coach';

interface Props {
  isCoach: boolean;
  coachApproved: string | null;
  isTalent: boolean;
  talentApproved: string | null;
  roles: string[];
  company: DataProfileApproval | null;
  agency: DataProfileApproval | null;
  saving: boolean;
  onSubmitCoach: () => void;
  onSubmitTalent: () => void;
  onClearRole: (role: WithdrawRole) => void;
}

interface RoleRow {
  key: string;
  icon: LucideIcon;
  iconClass: string;
  label: string;
  status: string;
  withdraw: WithdrawRole | null;
  apply: (() => void) | null;
  manageHref: string | null;
}

/**
 * Roles & Status rows: coach / talent applications plus company, client and
 * agency owner with their approval state (TC-01-23), and Withdraw with a
 * confirmation for coach / talent (TC-01-24).
 */
export function ProfileRolesStatus({
  isCoach,
  coachApproved,
  isTalent,
  talentApproved,
  roles,
  company,
  agency,
  saving,
  onSubmitCoach,
  onSubmitTalent,
  onClearRole,
}: Props) {
  const { t } = useLang();
  const [filters, setFilters] = useState<{ withdrawRole: WithdrawRole | null }>({ withdrawRole: null });

  const data = useMemo(() => {
    const getStatusLabel = (status: string | null) => {
      if (status === 'approved') return t('Approved', 'Disetujui');
      if (status === 'rejected') return t('Rejected', 'Ditolak');
      if (status === 'pending') return t('Pending approval', 'Menunggu approval');
      return t('Not applied', 'Belum daftar');
    };

    const rows: RoleRow[] = [
      {
        key: 'coach',
        icon: GraduationCap,
        iconClass: 'text-primary',
        label: t('Coach', 'Coach'),
        status: isCoach ? getStatusLabel(coachApproved) : t('Not applied', 'Belum daftar'),
        withdraw: isCoach && coachApproved !== 'rejected' ? 'coach' : null,
        apply: isCoach ? null : onSubmitCoach,
        manageHref: null,
      },
      {
        key: 'talent',
        icon: Star,
        iconClass: 'text-amber-400',
        label: t('Talent', 'Talent'),
        status: isTalent ? getStatusLabel(talentApproved) : t('Not applied', 'Belum daftar'),
        withdraw: isTalent && talentApproved !== 'rejected' ? 'talent' : null,
        apply: isTalent ? null : onSubmitTalent,
        manageHref: null,
      },
    ];

    if (company || roles.includes('company')) {
      rows.push({
        key: 'company',
        icon: Briefcase,
        iconClass: 'text-blue-400',
        label: company ? `${t('Company', 'Perusahaan')} · ${company.name}` : t('Company', 'Perusahaan'),
        status: company ? getStatusLabel(company.approval_status) : t('No company registered yet', 'Belum mendaftarkan perusahaan'),
        withdraw: null,
        apply: null,
        manageHref: company?.approval_status === 'approved' ? '/jobs/applicants' : '/jobs/post',
      });
    }
    if (roles.includes('client')) {
      rows.push({
        key: 'client',
        icon: Users2,
        iconClass: 'text-emerald-400',
        label: t('Client', 'Klien'),
        status: t('Active', 'Aktif'),
        withdraw: null,
        apply: null,
        manageHref: '/activity?tab=requests',
      });
    }
    if (agency || roles.includes('agency_owner')) {
      rows.push({
        key: 'agency',
        icon: Building2,
        iconClass: 'text-violet-400',
        label: agency ? `${t('Agency Owner', 'Pemilik Agency')} · ${agency.name}` : t('Agency Owner', 'Pemilik Agency'),
        status: agency ? getStatusLabel(agency.approval_status) : t('No agency registered yet', 'Belum mendaftarkan agency'),
        withdraw: null,
        apply: null,
        manageHref: agency ? '/agency/manage' : '/agency/register',
      });
    }

    const withdrawLabel = filters.withdrawRole === 'coach' ? t('Coach', 'Coach') : t('Talent', 'Talent');
    return { data: rows, withdrawLabel };
  }, [t, isCoach, coachApproved, isTalent, talentApproved, roles, company, agency, filters.withdrawRole, onSubmitCoach, onSubmitTalent]);

  const loadWithdraw = (role: WithdrawRole | null) => setFilters((prev) => ({ ...prev, withdrawRole: role }));
  const submitWithdraw = () => {
    if (filters.withdrawRole) onClearRole(filters.withdrawRole);
    loadWithdraw(null);
  };

  return (
    <>
      {data.data.map((row) => (
        <div key={row.key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4 transition-all hover:border-primary/30">
          <div className="flex min-w-0 items-center gap-3">
            <row.icon className={`h-5 w-5 shrink-0 ${row.iconClass}`} />
            <div className="min-w-0">
              <p className="truncate font-medium">{row.label}</p>
              <p className="text-sm text-muted-foreground">
                {t('Status', 'Status')}: <Badge variant="outline" className="ml-1 text-xs">{row.status}</Badge>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {row.apply && <Button variant="outline" size="sm" onClick={row.apply} disabled={saving}>{t('Apply', 'Daftar')}</Button>}
            {row.withdraw && (
              <Button variant="outline" size="sm" onClick={() => loadWithdraw(row.withdraw)} disabled={saving}>
                {t('Withdraw', 'Tarik')}
              </Button>
            )}
            {row.manageHref && (
              <Link href={row.manageHref}>
                <Button variant="ghost" size="sm">{t('Manage', 'Kelola')}</Button>
              </Link>
            )}
          </div>
        </div>
      ))}

      <AlertDialog open={filters.withdrawRole !== null} onOpenChange={(open) => !open && loadWithdraw(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`Withdraw ${data.withdrawLabel} status?`, `Tarik status ${data.withdrawLabel}?`)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Your status goes back to "Not applied" and you will no longer be listed. You can apply again later, which needs admin approval.',
                'Status Anda kembali ke "Belum daftar" dan Anda tidak lagi ditampilkan. Anda bisa mendaftar lagi nanti dengan approval admin.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel', 'Batal')}</AlertDialogCancel>
            <AlertDialogAction onClick={submitWithdraw}>{t('Withdraw', 'Tarik')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
