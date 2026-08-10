import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { CheckCircle2, Clock, Eye, MessageSquare, Paperclip } from 'lucide-react';
import type { Card as CardType } from '../../lib/types';
import { AvatarStack } from '../../components/ui/Avatar';
import { useBoardState } from './boardContext';
import { dueBadgeClass, dueDotClass, dueUrgency, formatDueDate } from './dueDate';

interface CardProps {
  card: CardType;
  onOpen: (card: CardType) => void;
}

export function Card({ card, onOpen }: CardProps) {
  const { labels, members } = useBoardState();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card._id,
    data: { type: 'card', cardId: card._id, listId: card.listId },
  });

  const cardLabels = (card.labels ?? [])
    .map((id) => labels.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));
  const cardMembers = (card.memberIds ?? [])
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const urgency = dueUrgency(card.dueDate);
  const commentCount = card.comments?.length ?? 0;
  const attachmentCount = card.files?.length ?? 0;

  const hasMeta =
    commentCount > 0 ||
    attachmentCount > 0 ||
    Boolean(card.watched) ||
    Boolean(card.dueDate) ||
    cardMembers.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        'group w-full cursor-pointer overflow-hidden rounded-lg border border-line bg-surface text-left shadow-sm',
        'transition-shadow hover:border-primary-300 hover:shadow',
        isDragging && 'z-10 shadow-lg ring-2 ring-primary-400',
      )}
      onClick={() => onOpen(card)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(card);
        }
      }}
      {...attributes}
      {...listeners}
    >
      {card.cover && (
        <div
          className="h-16 w-full"
          style={
            card.cover.type === 'color'
              ? { backgroundColor: card.cover.value }
              : { backgroundImage: card.cover.value, backgroundSize: 'cover', backgroundPosition: 'center' }
          }
        />
      )}

      <div className={clsx('px-3', card.cover ? 'py-2' : 'py-2.5')}>
        {cardLabels.length > 0 && (
          <div className="mb-1.5 flex flex-wrap items-center gap-1">
            {cardLabels.map((label) => (
              <span
                key={label.id}
                title={label.name}
                className="inline-block max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                style={{ backgroundColor: label.color, color: label.textColor }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm font-medium leading-snug text-ink">{card.title}</p>
          {card.watched && (
            <Eye
              className="h-3.5 w-3.5 shrink-0 text-ink-secondary/70"
              aria-label="Watching"
            />
          )}
        </div>

        {card.description && (
          <p className="mt-1 line-clamp-2 text-xs text-ink-secondary">{card.description}</p>
        )}

        {hasMeta && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {card.dueDate && (
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium tabular',
                    dueBadgeClass(urgency),
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {formatDueDate(card.dueDate)}
                </span>
              )}
              {commentCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-secondary">
                  <MessageSquare className="h-3 w-3" />
                  {commentCount}
                </span>
              )}
              {attachmentCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-secondary">
                  <Paperclip className="h-3 w-3" />
                  {attachmentCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {card.complete && (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-label="Complete" />
              )}
              {cardMembers.length > 0 && (
                <AvatarStack members={cardMembers} max={2} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Re-exported dot for filter/urgency indicators used elsewhere in the board. */
export { dueDotClass };
