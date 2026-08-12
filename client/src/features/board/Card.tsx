import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { CheckCircle2, Clock, Eye, MessageSquare, Paperclip } from 'lucide-react';
import type { Card as CardType } from '../../lib/types';
import { AvatarStack } from '../../components/ui/Avatar';
import { useBoardState } from './boardContext';
import { dueBadgeClass, dueDotClass, dueUrgency, formatDueDate } from './dueDate';

interface CardProps {
  card: CardType;
  onOpen: (card: CardType) => void;
}

interface CardVisualProps {
  card: CardType;
  /** Optional: when omitted the card is rendered non-interactively (e.g. drag overlay). */
  onOpen?: (card: CardType) => void;
  className?: string;
  style?: CSSProperties;
  /** While dragging the in-place card acts as an invisible placeholder. */
  isDragging?: boolean;
  /** Rendered floating above the board inside a DragOverlay. */
  isOverlay?: boolean;
}

/**
 * Presentational card. Used both for the in-list sortable item and for the
 * floating drag overlay, so the dragged card looks identical wherever it is.
 */
export const CardVisual = forwardRef<
  HTMLDivElement,
  CardVisualProps & HTMLAttributes<HTMLDivElement>
>(function CardVisual(
  { card, onOpen, className, style, isDragging, isOverlay, ...rest },
  ref,
) {
  const { labels, members } = useBoardState();

  const cardLabels = (card.labels ?? [])
    .map((id) => labels.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));
  const cardMembers = (card.memberIds ?? [])
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const urgency = dueUrgency(card.dueDate);
  const commentCount = card.comments?.length ?? 0;
  const imageFiles = (card.files ?? []).filter((f) => f.kind === 'image');
  const fileCount = (card.files ?? []).filter((f) => f.kind !== 'image').length;

  const hasMeta =
    commentCount > 0 ||
    fileCount > 0 ||
    Boolean(card.watched) ||
    Boolean(card.dueDate) ||
    cardMembers.length > 0;

  return (
    <div
      ref={ref}
      style={{
        ...style,
        // `scale` is a separate CSS property from `transform`, so it composes
        // with the transform dnd-kit applies to the overlay without conflicts.
        ...(isOverlay ? { scale: '1.04' } : null),
      }}
      className={clsx(
        'group w-full overflow-hidden rounded-lg border border-line bg-surface text-left shadow-sm',
        'transition-shadow hover:border-primary-300 hover:shadow',
        isDragging && 'opacity-0',
        isOverlay &&
          'pointer-events-none select-none cursor-grabbing shadow-2xl ring-2 ring-primary-400/70',
        className,
      )}
      onClick={onOpen ? () => onOpen(card) : undefined}
      onKeyDown={
        onOpen
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(card);
              }
            }
          : undefined
      }
      {...rest}
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

        {imageFiles.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {imageFiles.slice(0, 4).map((file) => (
              <img
                key={file.id}
                src={file.url}
                alt={file.name}
                loading="lazy"
                className="h-14 w-14 rounded-md border border-line object-cover"
              />
            ))}
            {imageFiles.length > 4 && (
              <span className="flex h-14 w-14 items-center justify-center rounded-md border border-line bg-ink/5 text-xs font-semibold text-ink-secondary">
                +{imageFiles.length - 4}
              </span>
            )}
          </div>
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
              {fileCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-secondary">
                  <Paperclip className="h-3 w-3" />
                  {fileCount}
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
});

/** Sortable wrapper used inside a list. */
export function Card({ card, onOpen }: CardProps) {
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

  return (
    <CardVisual
      ref={setNodeRef}
      card={card}
      onOpen={onOpen}
      isDragging={isDragging}
      style={{
        // While dragging, keep the placeholder pinned to its slot instead of
        // following the pointer — the DragOverlay provides the visual drag.
        transform: isDragging ? undefined : CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    />
  );
}

/** Re-exported dot for filter/urgency indicators used elsewhere in the board. */
export { dueDotClass };
