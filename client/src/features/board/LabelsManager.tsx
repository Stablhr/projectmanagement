import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useBoardState } from './boardContext';
import { LABEL_COLORS } from './boardBackgrounds';

function textOn(color: string): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1A2B2A' : '#FFFFFF';
}

interface LabelsManagerProps {
  open: boolean;
  onClose: () => void;
}

export function LabelsManager({ open, onClose }: LabelsManagerProps) {
  const { labels, addLabel, updateLabel, deleteLabel } = useBoardState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_COLORS[0].color);

  function startEdit(id: string, name: string) {
    setEditingId(id);
    setDraftName(name);
  }

  function commitEdit(id: string) {
    const name = draftName.trim();
    if (name) updateLabel(id, { name });
    setEditingId(null);
  }

  function submitNew() {
    const name = newName.trim();
    if (!name) return;
    addLabel(name, newColor);
    setNewName('');
  }

  return (
    <Modal open={open} onClose={onClose} title="Labels">
      <p className="mb-3 text-xs text-ink-secondary">
        Give cards colored tags. Labels are applied per-card from the card modal.
      </p>

      <div className="space-y-2">
        {labels.map((label) => (
          <div key={label.id} className="rounded-lg border border-line p-2">
            <div className="flex items-center gap-2">
              {editingId === label.id ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => commitEdit(label.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(label.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 rounded border border-primary-500 bg-surface px-2 py-1 text-sm text-ink focus:outline-none"
                />
              ) : (
                <span
                  className="flex-1 truncate rounded px-2 py-1 text-xs font-semibold"
                  style={{ backgroundColor: label.color, color: label.textColor }}
                >
                  {label.name}
                </span>
              )}

              {editingId !== label.id && (
                <>
                  <button
                    onClick={() => startEdit(label.id, label.name)}
                    className="rounded p-1 text-ink-secondary hover:bg-canvas"
                    aria-label={`Rename ${label.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteLabel(label.id)}
                    className="rounded p-1 text-danger hover:bg-danger/5"
                    aria-label={`Delete ${label.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>

            {editingId === label.id && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c.color}
                    title={c.name}
                    onClick={() => updateLabel(label.id, { color: c.color, textColor: textOn(c.color) })}
                    className={`h-6 w-6 rounded ${label.color === c.color ? 'ring-2 ring-primary-600 ring-offset-1' : ''}`}
                    style={{ backgroundColor: c.color }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-line p-2">
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitNew()}
            placeholder="Label name…"
            className="flex-1 rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-ink-secondary/60 focus:border-primary-500 focus:outline-none"
          />
          <div className="flex items-center gap-1">
            {LABEL_COLORS.slice(0, 5).map((c) => (
              <button
                key={c.color}
                title={c.name}
                onClick={() => setNewColor(c.color)}
                className={`h-5 w-5 rounded ${newColor === c.color ? 'ring-2 ring-primary-600 ring-offset-1' : ''}`}
                style={{ backgroundColor: c.color }}
                aria-label={c.name}
              />
            ))}
          </div>
          <Button size="sm" onClick={submitNew} aria-label="Add label">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
          Done
        </Button>
      </div>
    </Modal>
  );
}
