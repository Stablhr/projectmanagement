import type { BoardLabel, Card, MemberProfile } from '../../lib/types';
import type { FilterState } from './boardContext';
import { dueUrgency } from './dueDate';

const DAY = 24 * 60 * 60 * 1000;

interface FilterContext {
  members: MemberProfile[];
  labels: BoardLabel[];
  meId: string;
}

function matchesKeyword(card: Card, keyword: string, ctx: FilterContext): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  const labelNames = (card.labels ?? [])
    .map((id) => ctx.labels.find((l) => l.id === id)?.name ?? '')
    .join(' ');
  const memberNames = (card.memberIds ?? [])
    .map((id) => ctx.members.find((m) => m.id === id)?.name ?? '')
    .join(' ');
  const haystack = `${card.title} ${card.description} ${labelNames} ${memberNames}`.toLowerCase();
  return haystack.includes(q);
}

function matchesMembers(card: Card, f: FilterState['members'], meId: string): boolean {
  const ids = card.memberIds ?? [];
  const checks: boolean[] = [];
  if (f.none) checks.push(ids.length === 0);
  if (f.me) checks.push(ids.includes(meId));
  if (f.selected.length > 0) checks.push(f.selected.some((id) => ids.includes(id)));
  return checks.length === 0 || checks.some(Boolean);
}

function matchesStatus(card: Card, f: FilterState['status']): boolean {
  if (!f.complete && !f.incomplete) return true;
  if (f.complete && card.complete) return true;
  if (f.incomplete && !card.complete) return true;
  return false;
}

function matchesDue(card: Card, f: FilterState['due']): boolean {
  const checks: boolean[] = [];
  if (f.none) checks.push(!card.dueDate);
  if (f.overdue) checks.push(dueUrgency(card.dueDate) === 'overdue');
  if (f.soon) {
    const u = dueUrgency(card.dueDate);
    checks.push(u === 'soon' || u === 'overdue');
  }
  if (f.week || f.month) {
    const diff = card.dueDate ? new Date(card.dueDate).getTime() - Date.now() : Infinity;
    if (f.week) checks.push(diff >= 0 && diff <= 7 * DAY);
    if (f.month) checks.push(diff >= 0 && diff <= 30 * DAY);
  }
  return checks.length === 0 || checks.some(Boolean);
}

function matchesLabels(card: Card, f: FilterState['labels']): boolean {
  const ids = card.labels ?? [];
  const checks: boolean[] = [];
  if (f.none) checks.push(ids.length === 0);
  if (f.selected.length > 0) checks.push(f.selected.some((id) => ids.includes(id)));
  return checks.length === 0 || checks.some(Boolean);
}

function matchesActivity(card: Card, f: FilterState['activity']): boolean {
  const updated = card.updatedAt ? new Date(card.updatedAt).getTime() : 0;
  if (!updated) return true;
  const age = Date.now() - updated;
  const checks: boolean[] = [];
  if (f.week) checks.push(age <= 7 * DAY);
  if (f.twoWeeks) checks.push(age <= 14 * DAY);
  if (f.month) checks.push(age <= 30 * DAY);
  return checks.length === 0 || checks.some(Boolean);
}

/** AND across sections, OR within a section. */
export function matchesFilters(card: Card, filters: FilterState, ctx: FilterContext): boolean {
  if (!matchesKeyword(card, filters.keyword, ctx)) return false;
  if (!matchesMembers(card, filters.members, ctx.meId)) return false;
  if (!matchesStatus(card, filters.status)) return false;
  if (!matchesDue(card, filters.due)) return false;
  if (!matchesLabels(card, filters.labels)) return false;
  if (!matchesActivity(card, filters.activity)) return false;
  return true;
}

export function filterCards(
  cards: Card[],
  filters: FilterState,
  ctx: FilterContext,
): Card[] {
  return cards.filter((c) => matchesFilters(c, filters, ctx));
}
