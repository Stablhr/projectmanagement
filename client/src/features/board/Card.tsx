import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import type { Card as CardType } from '../../lib/types';

interface CardProps {
  card: CardType;
  onOpen: (card: CardType) => void;
}

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
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        'w-full cursor-pointer rounded-lg border border-line bg-surface px-3 py-2.5 text-left shadow-sm',
        'transition-shadow hover:shadow hover:border-primary-300',
        isDragging && 'z-10 shadow-lg ring-2 ring-primary-400',
      )}
      onClick={() => onOpen(card)}
      {...attributes}
      {...listeners}
    >
      <p className="text-sm font-medium text-ink">{card.title}</p>
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-ink-secondary">
          {card.description}
        </p>
      )}
    </button>
  );
}
