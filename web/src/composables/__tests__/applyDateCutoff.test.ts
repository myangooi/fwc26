/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { applyDateCutoff } from '../useSimulation';
import type { Group, Fixture } from '../../types';

function makeFixture(
  id: number,
  date: string,
  status: Fixture['status'],
  score: { home: number; away: number } | null,
): Fixture {
  return {
    id,
    date,
    homeTeam: { id: 10, name: 'Alpha', tla: 'ALP', crest: '' },
    awayTeam: { id: 11, name: 'Beta', tla: 'BET', crest: '' },
    score,
    status,
    bookings: [],
  };
}

function makeGroup(fixtures: Fixture[]): Group {
  return { name: 'Group A', teams: [], fixtures, standings: [] };
}

describe('applyDateCutoff', () => {
  it('returns the same reference when cutoffDate is null', () => {
    const groups = [makeGroup([makeFixture(1, '2026-06-12T18:00:00Z', 'FINISHED', { home: 1, away: 0 })])];
    expect(applyDateCutoff(groups, null)).toBe(groups);
  });

  it('converts a FINISHED fixture after the cutoff to SCHEDULED with null score', () => {
    const groups = [makeGroup([makeFixture(1, '2026-06-15T20:00:00Z', 'FINISHED', { home: 2, away: 1 })])];
    const result = applyDateCutoff(groups, '2026-06-14');
    expect(result[0].fixtures[0].status).toBe('SCHEDULED');
    expect(result[0].fixtures[0].score).toBeNull();
  });

  it('leaves a FINISHED fixture on the cutoff date unchanged', () => {
    const groups = [makeGroup([makeFixture(1, '2026-06-14T18:00:00Z', 'FINISHED', { home: 1, away: 0 })])];
    const result = applyDateCutoff(groups, '2026-06-14');
    expect(result[0].fixtures[0].status).toBe('FINISHED');
    expect(result[0].fixtures[0].score).toEqual({ home: 1, away: 0 });
  });

  it('leaves a SCHEDULED fixture unchanged regardless of date', () => {
    const groups = [makeGroup([makeFixture(1, '2026-06-20T18:00:00Z', 'SCHEDULED', null)])];
    const result = applyDateCutoff(groups, '2026-06-14');
    expect(result[0].fixtures[0].status).toBe('SCHEDULED');
    expect(result[0].fixtures[0].score).toBeNull();
  });

  it('handles multiple groups and mixed fixtures correctly', () => {
    const groups = [
      makeGroup([
        makeFixture(1, '2026-06-10T18:00:00Z', 'FINISHED', { home: 1, away: 0 }),
        makeFixture(2, '2026-06-16T18:00:00Z', 'FINISHED', { home: 3, away: 2 }),
      ]),
      makeGroup([
        makeFixture(3, '2026-06-17T18:00:00Z', 'SCHEDULED', null),
      ]),
    ];
    const result = applyDateCutoff(groups, '2026-06-15');
    expect(result[0].fixtures[0].status).toBe('FINISHED');
    expect(result[0].fixtures[1].status).toBe('SCHEDULED');
    expect(result[0].fixtures[1].score).toBeNull();
    expect(result[1].fixtures[0].status).toBe('SCHEDULED');
  });
});
