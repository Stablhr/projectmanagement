import { clsx } from 'clsx';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { Card as CardType } from '../../lib/types';
import { useDeleteCard } from '../cards/useCards';
import { useUpdateCard } from './useBoard';

interface CardModalProps {
  boardId: string;
  card: CardType;
  onClose: () => void;
}

export function CardModal({ boardId, card, onClose }: CardModalProps) {
  const update = useUpdateCard(boardId);
  const remove = useDeleteCard(boardId);

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);

  function saveTitle() {
    const next = title.trim();
    if (next && next !== card.title) update.mutate({ cardId: card._id, title: next });
  }

  function saveDescription() {
    if (description !== card.description) {
      update.mutate({ cardId: card._id, description });
    }
  }

  async function removeCard() {
    if (!window.confirm(`Delete card "${card.title}"?`)) return;
    await remove.mutateAsync(card._id);
    onClose();
  }

  return (
    <Modal open onClose={onClose} size="lg">
      {card.cover && (
        <div
          className="-mt-4 h-28 w-full rounded-t-2xl"
          style={
            card.cover.type === 'color'
              ? { backgroundColor: card.cover.value }
              : {
                  backgroundImage: card.cover.value,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
          }
        />
      )}
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className={clsx(
          'w-full rounded-lg border border-transparent bg-transparent font-display text-xl font-semibold text-ink hover:border-line focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500/30',
          card.cover ? 'mt-4' : '',
        )}
      />
      <p className="mt-1 font-mono text-xs text-ink-secondary">
        in list {card.listId.slice(-6)}
      </p>

      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
          rows={4}
          placeholder="Add a more detailed description…"
          className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-secondary/60 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={removeCard}>
          <Trash2 className="h-4 w-4 text-danger" />
          Delete
        </Button>
      </div>
    </Modal>
  );
}
