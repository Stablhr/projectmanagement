import { clsx } from 'clsx';
import type { MemberProfile } from '../../lib/types';

interface AvatarProps {
  member: Pick<MemberProfile, 'name' | 'initials' | 'color'>;
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

export function Avatar({ member, size = 'sm', className, title }: AvatarProps) {
  return (
    <span
      title={title ?? member.name}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface',
        size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
        className,
      )}
      style={{ backgroundColor: member.color }}
    >
      {member.initials}
    </span>
  );
}

interface AvatarStackProps {
  members: Pick<MemberProfile, 'name' | 'initials' | 'color'>[];
  max?: number;
  size?: 'sm' | 'md';
}

export function AvatarStack({ members, max = 3, size = 'sm' }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const extra = members.length - visible.length;
  return (
    <span className="inline-flex items-center -space-x-1.5">
      {visible.map((m) => (
        <Avatar key={m.name} member={m} size={size} />
      ))}
      {extra > 0 && (
        <span
          className={clsx(
            'inline-flex items-center justify-center rounded-full bg-ink/10 font-semibold text-ink-secondary ring-2 ring-surface',
            size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
          )}
          title={`${extra} more`}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
