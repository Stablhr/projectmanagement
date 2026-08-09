import { Link2, Send } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useBoardState } from './boardContext';
import type { MemberProfile } from '../../lib/types';

type BoardRole = 'admin' | 'member' | 'observer';

const ROLE_OPTIONS: { value: BoardRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'observer', label: 'Observer' },
];

interface MemberRowProps {
  member: MemberProfile;
  role: BoardRole;
  onRoleChange: (role: BoardRole) => void;
}

function MemberRow({ member, role, onRoleChange }: MemberRowProps) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <Avatar member={member} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {member.name}
          {member.isMe && <span className="text-ink-secondary"> (you)</span>}
        </p>
        <p className="truncate text-xs text-ink-secondary">{member.email}</p>
      </div>
      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value as BoardRole)}
        aria-label={`Role for ${member.name}`}
        className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-primary-500 focus:outline-none"
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ShareBoardModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShareBoardModal({ open, onClose }: ShareBoardModalProps) {
  const { members } = useBoardState();

  const [tab, setTab] = useState<'members' | 'requests'>('members');
  const [roles, setRoles] = useState<Record<string, BoardRole>>(() => {
    const initial: Record<string, BoardRole> = {};
    members.forEach((m, i) => {
      initial[m.id] = i === 0 ? 'admin' : 'member';
    });
    return initial;
  });
  const [invite, setInvite] = useState('');
  const [inviteRole, setInviteRole] = useState<BoardRole>('member');
  const [pendingMembers, setPendingMembers] = useState<MemberProfile[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const inviteRequests: (MemberProfile & { date: string })[] = [
    { id: 'req-diego', name: 'Diego Silva', email: 'diego@flowline.app', initials: 'DS', color: '#7C3AED', date: 'Yesterday' },
    { id: 'req-priya', name: 'Priya Nair', email: 'priya@flowline.app', initials: 'PN', color: '#DC2626', date: '2 days ago' },
  ];

  function submitInvite() {
    const value = invite.trim();
    if (!value) return;
    const isEmail = value.includes('@');
    const initials = value
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
    const member: MemberProfile = {
      id: `pending-${Date.now()}`,
      name: isEmail ? value.split('@')[0] : value,
      email: isEmail ? value : `${value.toLowerCase().replace(/\s+/g, '.')}@flowline.app`,
      initials: initials || '?',
      color: '#2E8C83',
    };
    setPendingMembers((prev) => [...prev, member]);
    setRoles((prev) => ({ ...prev, [member.id]: inviteRole }));
    setInvite('');
    setMessage(`Invited ${member.name} as ${ROLE_OPTIONS.find((r) => r.value === inviteRole)?.label}.`);
  }

  function createLink() {
    const token = Math.random().toString(36).slice(2, 10);
    setInviteLink(`${window.location.origin}/invite/${token}`);
  }

  const allMembers = [...members, ...pendingMembers];

  return (
    <Modal open={open} onClose={onClose} title="Share board">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
            Email address or name
          </label>
          <div className="flex items-center gap-1.5">
            <input
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitInvite()}
              placeholder="e.g. aria@flowline.app"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-secondary/60 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as BoardRole)}
              aria-label="Invite role"
              className="rounded-lg border border-line bg-surface px-2 py-2 text-xs text-ink focus:border-primary-500 focus:outline-none"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={submitInvite} aria-label="Share board">
              <Send className="h-3.5 w-3.5" />
              Share
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-line p-2.5">
          {!inviteLink ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-ink">
                <Link2 className="h-4 w-4 text-ink-secondary" />
                Share this board with a link
              </div>
              <Button size="sm" variant="secondary" onClick={createLink}>
                Create link
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-ink-secondary">Anyone with the link can join</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded border border-line bg-canvas px-2 py-1.5 text-xs text-ink-secondary focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard?.writeText(inviteLink);
                    setMessage('Link copied to clipboard.');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>

        {message && <p className="text-xs font-medium text-success">{message}</p>}

        <div>
          <div className="mb-2 flex items-center gap-4 border-b border-line">
            <button
              onClick={() => setTab('members')}
              className={`border-b-2 pb-1.5 text-sm font-medium transition-colors ${
                tab === 'members'
                  ? 'border-primary-600 text-primary-800'
                  : 'border-transparent text-ink-secondary hover:text-ink'
              }`}
            >
              Board members ({allMembers.length})
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`border-b-2 pb-1.5 text-sm font-medium transition-colors ${
                tab === 'requests'
                  ? 'border-primary-600 text-primary-800'
                  : 'border-transparent text-ink-secondary hover:text-ink'
              }`}
            >
              Join requests ({inviteRequests.length})
            </button>
          </div>

          {tab === 'members' ? (
            <div className="divide-y divide-line">
              {allMembers.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  role={roles[m.id] ?? 'member'}
                  onRoleChange={(role) => setRoles((prev) => ({ ...prev, [m.id]: role }))}
                />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-line">
              {inviteRequests.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 py-2">
                  <Avatar member={r} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                    <p className="truncate text-xs text-ink-secondary">Requested {r.date}</p>
                  </div>
                  <Button size="sm">Approve</Button>
                  <Button size="sm" variant="ghost">
                    Deny
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
