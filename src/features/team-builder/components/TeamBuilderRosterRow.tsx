'use client';

import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import type { DataTeamBuilderRoster } from '@/features/team-builder/types/teamBuilderTypes';

const gradeTone: Record<string, string> = {
  senior: 'border-eco-violet/40 bg-eco-violet/10 text-eco-violet',
  mid: 'border-eco-blue/40 bg-eco-blue/10 text-eco-blue',
  junior: 'border-border bg-muted text-muted-foreground',
};

interface Props {
  member: DataTeamBuilderRoster;
  isOwner: boolean;
  onEditTeamBuilderMembers: (memberId: string, roleTitle: string) => Promise<boolean>;
  onClearTeamBuilderMembers: (memberId: string) => void;
}

// One roster line. Owners can rename the role inline and remove the row;
// an invited row shows "Invited" in place of the grade until accepted.
export default function TeamBuilderRosterRow({ member, isOwner, onEditTeamBuilderMembers, onClearTeamBuilderMembers }: Props) {
  const { t } = useLang();

  const [filters, setFilters] = useState({ isEditing: false, roleTitle: member.role_title });

  const initial = (member.full_name ?? '?').charAt(0).toUpperCase();
  const isInvited = member.status === 'invited';
  const gradeClass = member.grade ? gradeTone[member.grade] : '';

  const editTeamBuilderMembersToggle = () => {
    setFilters((prev) => ({ ...prev, isEditing: !prev.isEditing, roleTitle: member.role_title }));
  };

  const editTeamBuilderMembersRole = (value: string) => {
    setFilters((prev) => ({ ...prev, roleTitle: value }));
  };

  const submitTeamBuilderMembers = async () => {
    if (!filters.roleTitle.trim()) return;
    const saved = await onEditTeamBuilderMembers(member.member_id, filters.roleTitle.trim());
    if (saved) setFilters((prev) => ({ ...prev, isEditing: false }));
  };

  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-9 w-9">
          {member.avatar_url && <AvatarImage src={member.avatar_url} />}
          <AvatarFallback className="bg-primary/15 text-xs text-primary">{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{member.full_name ?? t('Member', 'Member')}</p>
          {filters.isEditing ? (
            <div className="mt-1 flex items-center gap-1.5">
              <Input
                value={filters.roleTitle}
                onChange={(e) => editTeamBuilderMembersRole(e.target.value)}
                className="h-8 max-w-[220px] text-xs"
                aria-label={t('Role', 'Role')}
              />
              <button onClick={submitTeamBuilderMembers} className="text-muted-foreground hover:text-foreground" aria-label={t('Save role', 'Simpan role')}>
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="truncate text-xs text-muted-foreground">{member.role_title}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isInvited ? (
          <Badge variant="outline" className="border-dashed text-muted-foreground">{t('Invited', 'Diundang')}</Badge>
        ) : (
          <Badge variant="outline" className={`capitalize ${gradeClass}`}>{member.grade}</Badge>
        )}
        {isOwner && (
          <button onClick={editTeamBuilderMembersToggle} className="text-muted-foreground hover:text-foreground" aria-label={t('Edit role', 'Ubah role')}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {isOwner && (
          <button onClick={() => onClearTeamBuilderMembers(member.member_id)} className="text-muted-foreground hover:text-destructive" aria-label={t('Remove', 'Hapus')}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
