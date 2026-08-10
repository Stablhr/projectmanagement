import { clsx } from 'clsx';
import {
  CalendarX,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Paperclip,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { uid } from '../../lib/ids';
import { nowIso, relativeTime } from '../../lib/time';
import type {
  Card as CardType,
  CardActivityEntry,
  CardComment,
  CardFile,
  CardReactions,
} from '../../lib/types';
import { uploadAttachment } from '../cards/attachments';
import { useDeleteCard } from '../cards/useCards';
import { ME_ID, meProfile } from './boardData';
import { useBoardState } from './boardContext';
import { useUpdateCard, type CardPatch } from './useBoard';

interface CardModalProps {
  boardId: string;
  card: CardType;
  onClose: () => void;
}

const COVER_COLORS = [
  '#EB5A46',
  '#FF9F1A',
  '#F2D600',
  '#61BD4F',
  '#51E898',
  '#00C2E0',
  '#0079BF',
  '#C377E0',
  '#FF78CB',
  '#344563',
];

const REACTIONS = ['👍', '🎉', '👀', '❤️'];

interface Draft {
  cover: CardType['cover'] | null;
  labels: string[];
  memberIds: string[];
  dueDate: string | null;
  location: string;
  files: CardFile[];
  reactions: CardReactions;
  comments: CardComment[];
  activity: CardActivityEntry[];
  watched: boolean;
  complete: boolean;
}

function pickDraft(patch: CardPatch): Partial<Draft> {
  return {
    ...(patch.cover !== undefined ? { cover: patch.cover } : {}),
    ...(patch.labels !== undefined ? { labels: patch.labels } : {}),
    ...(patch.memberIds !== undefined ? { memberIds: patch.memberIds } : {}),
    ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate ?? null } : {}),
    ...(patch.location !== undefined ? { location: patch.location } : {}),
    ...(patch.files !== undefined ? { files: patch.files } : {}),
    ...(patch.reactions !== undefined ? { reactions: patch.reactions } : {}),
    ...(patch.comments !== undefined ? { comments: patch.comments } : {}),
    ...(patch.activity !== undefined ? { activity: patch.activity } : {}),
    ...(patch.watched !== undefined ? { watched: patch.watched } : {}),
    ...(patch.complete !== undefined ? { complete: patch.complete } : {}),
  };
}

function dueInputValue(dueDate: string | null | undefined): string {
  return dueDate ? dueDate.slice(0, 10) : '';
}

export function CardModal({ boardId, card, onClose }: CardModalProps) {
  const update = useUpdateCard(boardId);
  const remove = useDeleteCard(boardId);
  const { labels, members, visibleBoard } = useBoardState();

  const [titleDraft, setTitleDraft] = useState(card.title);
  const [descDraft, setDescDraft] = useState(card.description);
  const [commentDraft, setCommentDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const titleFocused = useRef(false);
  const descFocused = useRef(false);

  const [draft, setDraft] = useState<Draft>(() => ({
    cover: card.cover ?? null,
    labels: card.labels ?? [],
    memberIds: card.memberIds ?? [],
    dueDate: card.dueDate ?? null,
    location: card.location ?? '',
    files: card.files ?? [],
    reactions: card.reactions ?? {},
    comments: card.comments ?? [],
    activity: card.activity ?? [],
    watched: card.watched ?? false,
    complete: card.complete ?? false,
  }));

  useEffect(() => {
    if (!titleFocused.current) setTitleDraft(card.title);
  }, [card.title]);
  useEffect(() => {
    if (!descFocused.current) setDescDraft(card.description);
  }, [card.description]);
  useEffect(() => {
    setDraft({
      cover: card.cover ?? null,
      labels: card.labels ?? [],
      memberIds: card.memberIds ?? [],
      dueDate: card.dueDate ?? null,
      location: card.location ?? '',
      files: card.files ?? [],
      reactions: card.reactions ?? {},
      comments: card.comments ?? [],
      activity: card.activity ?? [],
      watched: card.watched ?? false,
      complete: card.complete ?? false,
    });
  }, [
    card.cover,
    card.labels,
    card.memberIds,
    card.dueDate,
    card.location,
    card.files,
    card.reactions,
    card.comments,
    card.activity,
    card.watched,
    card.complete,
  ]);

  const listName = visibleBoard.lists.find((l) => l._id === card.listId)?.title;
  const me = meProfile();

  function apply(patch: CardPatch) {
    update.mutate({ cardId: card._id, patch });
  }

  /** Optimistically update the local draft and persist. Logs an activity entry when `text` is given. */
  function mutate(patch: CardPatch, activityText?: string) {
    let next = patch;
    if (activityText) {
      const entry = { id: uid(), text: activityText, createdAt: nowIso() };
      next = { ...patch, activity: [entry, ...draft.activity].slice(0, 30) };
    }
    setDraft((prev) => ({ ...prev, ...pickDraft(next) }));
    apply(next);
  }

  function saveTitle() {
    const next = titleDraft.trim();
    if (next && next !== card.title) mutate({ title: next }, `Renamed card to “${next}”`);
  }

  function saveDescription() {
    if (descDraft !== card.description) {
      mutate({ description: descDraft }, descDraft.trim() ? 'Updated the description' : 'Removed the description');
    }
  }

  function saveLocation() {
    const next = draft.location.trim();
    if (next !== (card.location ?? '')) {
      mutate({ location: next }, next ? `Set location to “${next}”` : 'Removed location');
    }
  }

  function toggleLabel(labelId: string) {
    const label = labels.find((l) => l.id === labelId);
    const has = draft.labels.includes(labelId);
    const nextLabels = has
      ? draft.labels.filter((id) => id !== labelId)
      : [...draft.labels, labelId];
    mutate({ labels: nextLabels }, has ? `Removed label ${label?.name ?? labelId}` : `Added label ${label?.name ?? labelId}`);
  }

  function toggleMember(memberId: string) {
    const member = members.find((m) => m.id === memberId);
    const has = draft.memberIds.includes(memberId);
    const next = has
      ? draft.memberIds.filter((id) => id !== memberId)
      : [...draft.memberIds, memberId];
    mutate({ memberIds: next }, has ? `Unassigned ${member?.name ?? memberId}` : `Assigned to ${member?.name ?? memberId}`);
  }

  function setCover(value: string | null) {
    mutate(
      { cover: value ? { type: 'color', value } : null },
      value ? 'Changed the cover' : 'Removed the cover',
    );
  }

  function setDueDate(dateStr: string) {
    const dueDate = dateStr ? new Date(`${dateStr}T12:00:00`).toISOString() : null;
    mutate(
      { dueDate },
      dueDate
        ? `Set due date to ${new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
        : 'Removed due date',
    );
  }

  function toggleReaction(emoji: string) {
    const current = draft.reactions[emoji] ?? [];
    const has = current.includes(ME_ID);
    const reactions: CardReactions = {
      ...draft.reactions,
      [emoji]: has ? current.filter((id) => id !== ME_ID) : [...current, ME_ID],
    };
    if (reactions[emoji].length === 0) delete reactions[emoji];
    mutate({ reactions });
  }

  function addComment() {
    const text = commentDraft.trim();
    if (!text) return;
    const comment: CardComment = {
      id: uid(),
      authorId: ME_ID,
      authorName: me.name,
      text,
      createdAt: nowIso(),
    };
    setCommentDraft('');
    mutate({ comments: [...draft.comments, comment] }, 'Added a comment');
  }

  function toggleWatch() {
    mutate({ watched: !draft.watched }, draft.watched ? 'Stopped watching this card' : 'Started watching this card');
  }

  function removeFile(fileId: string) {
    mutate({ files: draft.files.filter((f) => f.id !== fileId) });
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files;
    event.target.value = '';
    if (!selected || selected.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded: CardFile[] = [];
      for (const file of Array.from(selected)) {
        uploaded.push(await uploadAttachment(card._id, file));
      }
      const files = [...draft.files, ...uploaded];
      const text =
        uploaded.length === 1
          ? `Attached ${uploaded[0].name}`
          : `Attached ${uploaded.length} files`;
      const entry = { id: uid(), text, createdAt: nowIso() };
      const activity = [entry, ...draft.activity].slice(0, 30);
      setDraft((prev) => ({ ...prev, files, activity }));
      apply({ files, activity });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function removeCard() {
    if (!window.confirm(`Delete card "${card.title}"?`)) return;
    await remove.mutateAsync(card._id);
    onClose();
  }

  const sectionLabel =
    'mb-1.5 block text-sm font-medium text-ink-secondary';

  return (
    <Modal open onClose={onClose} size="lg">
      {draft.cover && (
        <div
          className="-mt-4 h-28 w-full rounded-t-2xl"
          style={
            draft.cover.type === 'color'
              ? { backgroundColor: draft.cover.value }
              : { backgroundImage: draft.cover.value, backgroundSize: 'cover', backgroundPosition: 'center' }
          }
        />
      )}

      <div className={clsx('flex items-start justify-between gap-2', draft.cover ? 'mt-4' : 'mt-1')}>
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onFocus={() => (titleFocused.current = true)}
          onBlur={() => {
            titleFocused.current = false;
            saveTitle();
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="w-full rounded-lg border border-transparent bg-transparent font-display text-xl font-semibold text-ink hover:border-line focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        />
        <button
          onClick={toggleWatch}
          className={clsx(
            'shrink-0 rounded-lg p-2 transition-colors',
            draft.watched
              ? 'bg-primary-200/60 text-primary-800'
              : 'text-ink-secondary hover:bg-canvas',
          )}
          aria-label={draft.watched ? 'Stop watching this card' : 'Watch this card'}
          title={draft.watched ? 'Watching' : 'Watch'}
        >
          {draft.watched ? <Eye className="h-4 w-4 fill-current" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>

      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-secondary">
        <span>in list {listName ?? '…'}</span>
        {draft.location && (
          <span className="inline-flex items-center gap-1 rounded bg-ink/5 px-1.5 py-0.5 text-ink-secondary">
            <MapPin className="h-3 w-3" />
            {draft.location}
          </span>
        )}
      </p>

      {/* Description */}
      <div className="mt-5">
        <label className={sectionLabel}>Description</label>
        <textarea
          value={descDraft}
          onChange={(e) => setDescDraft(e.target.value)}
          onFocus={() => (descFocused.current = true)}
          onBlur={() => {
            descFocused.current = false;
            saveDescription();
          }}
          rows={4}
          placeholder="Add a more detailed description…"
          className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-secondary/60 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_240px]">
        <div className="space-y-6">
          {/* Cover */}
          <section>
            <label className={sectionLabel}>Cover</label>
            <div className="flex flex-wrap items-center gap-2">
              {COVER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setCover(color)}
                  aria-label={`Set cover ${color}`}
                  className={clsx(
                    'h-8 w-8 rounded-md border border-black/10 transition-transform hover:scale-110',
                    draft.cover?.type === 'color' && draft.cover.value === color && 'ring-2 ring-primary-500 ring-offset-1',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              {draft.cover && (
                <button
                  onClick={() => setCover(null)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-secondary hover:bg-canvas"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove cover
                </button>
              )}
            </div>
          </section>

          {/* Labels */}
          <section>
            <label className={sectionLabel}>Labels</label>
            {draft.labels.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {draft.labels
                  .map((id) => labels.find((l) => l.id === id))
                  .filter((l): l is NonNullable<typeof l> => Boolean(l))
                  .map((label) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: label.color, color: label.textColor }}
                    >
                      {label.name}
                      <button
                        onClick={() => toggleLabel(label.id)}
                        aria-label={`Remove label ${label.name}`}
                        className="rounded-sm hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => {
                const active = draft.labels.includes(label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-transparent text-white'
                        : 'border-line bg-surface text-ink-secondary hover:bg-canvas',
                    )}
                    style={active ? { backgroundColor: label.color } : undefined}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: active ? '#fff' : label.color }}
                    />
                    {label.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Members */}
          <section>
            <label className={sectionLabel}>Members</label>
            <div className="space-y-1">
              {members.map((member) => {
                const active = draft.memberIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={clsx(
                      'flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition-colors',
                      active
                        ? 'border-primary-400 bg-primary-200/40 text-ink'
                        : 'border-line bg-surface text-ink-secondary hover:bg-canvas',
                    )}
                  >
                    <Avatar member={member} size="sm" />
                    <span className="flex-1 truncate">{member.name}</span>
                    {active && <span className="text-xs font-semibold text-primary-800">Assigned</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Due date */}
          <section>
            <label className={sectionLabel}>Due date</label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="relative">
                <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
                <input
                  type="date"
                  value={dueInputValue(draft.dueDate)}
                  onChange={(e) => setDueDate(e.target.value)}
                  aria-label="Due date"
                  className="rounded-lg border border-line bg-surface py-2 pl-8 pr-2 text-sm text-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </span>
              {draft.dueDate && (
                <button
                  onClick={() => setDueDate('')}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-secondary hover:bg-canvas"
                >
                  <CalendarX className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* Location */}
          <section>
            <label className={sectionLabel}>Location</label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
              <input
                value={draft.location}
                onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                onBlur={saveLocation}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                placeholder="e.g. Floor 3, Room 4B"
                className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-secondary/60 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </section>

          {/* Attachments */}
          <section>
            <label className={sectionLabel}>Files</label>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-ink/5 px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:bg-ink/10">
                <Paperclip className="h-3.5 w-3.5" />
                {uploading ? 'Uploading…' : 'Attach file'}
                <input type="file" multiple className="hidden" onChange={(e) => void handleFiles(e)} disabled={uploading} />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-ink/5 px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:bg-ink/10">
                <ImageIcon className="h-3.5 w-3.5" />
                Add image
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleFiles(e)}
                  disabled={uploading}
                />
              </label>
              {uploading && <Loader2 className="h-4 w-4 animate-spin text-ink-secondary" />}
            </div>
            {uploadError && <p className="mt-1.5 text-xs text-danger">{uploadError}</p>}
            {draft.files.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {draft.files.map((file) => (
                  <li key={file.id} className="flex items-center gap-2">
                    {file.kind === 'image' ? (
                      <ImageIcon className="h-4 w-4 shrink-0 text-ink-secondary" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-ink-secondary" />
                    )}
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-sm text-primary-800 hover:underline"
                      title={file.name}
                    >
                      {file.name}
                    </a>
                    <button
                      onClick={() => removeFile(file.id)}
                      aria-label={`Remove ${file.name}`}
                      className="rounded p-1 text-ink-secondary hover:bg-canvas hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Reactions */}
          <section>
            <label className={sectionLabel}>Reactions</label>
            <div className="flex flex-wrap gap-2">
              {REACTIONS.map((emoji) => {
                const ids = draft.reactions[emoji] ?? [];
                const mine = ids.includes(ME_ID);
                return (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(emoji)}
                    aria-label={`React ${emoji}${mine ? ' (remove)' : ''}`}
                    className={clsx(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition-colors',
                      mine
                        ? 'border-primary-500 bg-primary-200/50'
                        : 'border-line bg-surface hover:bg-canvas',
                    )}
                  >
                    <span>{emoji}</span>
                    {ids.length > 0 && (
                      <span className="text-xs font-semibold tabular text-ink-secondary">{ids.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Comments */}
          <section>
            <label className={sectionLabel}>Comments</label>
            <div className="space-y-3">
              {draft.comments.map((comment) => {
                const author = members.find((m) => m.id === comment.authorId) ?? me;
                return (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar member={author} size="sm" />
                    <div className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">{comment.authorName}</span>
                        <span className="text-xs text-ink-secondary">{relativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{comment.text}</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-2">
                <Avatar member={me} size="sm" />
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addComment()}
                  placeholder="Write a comment…"
                  aria-label="Write a comment"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-secondary/60 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
                <Button onClick={addComment} disabled={!commentDraft.trim()} size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Post
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* Activity */}
        <aside>
          <label className={sectionLabel}>Activity</label>
          {draft.activity.length === 0 ? (
            <p className="text-xs text-ink-secondary/70">No activity yet.</p>
          ) : (
            <ol className="space-y-2.5">
              {draft.activity.slice(0, 8).map((entry) => (
                <li key={entry.id} className="text-sm leading-snug text-ink">
                  <span className="text-ink-secondary">{entry.text}</span>
                  <span className="ml-1.5 text-xs text-ink-secondary/60">{relativeTime(entry.createdAt)}</span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>

      <div className="mt-6 flex justify-end border-t border-line pt-4">
        <Button variant="ghost" onClick={removeCard}>
          <Trash2 className="h-4 w-4 text-danger" />
          Delete
        </Button>
      </div>
    </Modal>
  );
}
