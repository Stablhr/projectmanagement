import { describe, expect, it } from 'vitest';
import { dueBadgeClass, dueUrgency, type DueUrgency } from './dueDate';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function iso(msFromNow: number) {
  return new Date(Date.now() + msFromNow).toISOString();
}

describe('dueUrgency', () => {
  it('returns none without a due date', () => {
    expect(dueUrgency(null)).toBe('none');
    expect(dueUrgency(undefined)).toBe('none');
  });

  it('flags past dates as overdue', () => {
    expect(dueUrgency(iso(-1 * DAY))).toBe('overdue');
  });

  it('flags dates within 48h as soon', () => {
    expect(dueUrgency(iso(6 * HOUR))).toBe('soon');
    expect(dueUrgency(iso(2 * DAY))).toBe('soon');
  });

  it('flags later dates as on-time', () => {
    expect(dueUrgency(iso(3 * DAY))).toBe('on-time');
  });

  it('maps urgency to distinct badge classes', () => {
    const classes: DueUrgency[] = ['overdue', 'soon', 'on-time', 'none'];
    expect(new Set(classes.map(dueBadgeClass)).size).toBe(4);
  });
});
