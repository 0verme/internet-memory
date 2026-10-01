import { describe, expect, it } from 'vitest';
import { listPublishedRecordsForPerson } from '../src/lib/repositories/records';

const publicRow = {
  id: 'record-1',
  person_id: 'person-1',
  platform: 'x' as const,
  handle: 'demo',
  display_name: 'Demo Account',
  avatar_url: null,
  profile_url: 'https://x.com/demo',
  content: 'Mock public record.',
  source_url: null,
  occurred_at: null,
  submitted_at: '2026-09-30T00:00:00.000Z',
};

describe('listPublishedRecordsForPerson', () => {
  it('uses a bound person ID, filters hidden records, and returns only public fields', async () => {
    let query = '';
    let parameters: unknown[] = [];
    const db = {
      prepare(sql: string) {
        query = sql;
        return {
          bind(...values: unknown[]) {
            parameters = values;
            return {
              async all() {
                return { results: [publicRow], success: true };
              },
            };
          },
        };
      },
    } as unknown as Pick<D1Database, 'prepare'>;

    await expect(listPublishedRecordsForPerson(db, 'person-1')).resolves.toEqual([publicRow]);
    expect(query).toContain("records.status = 'published'");
    expect(query).toContain('records.person_id = ?');
    expect(query.toLowerCase()).not.toContain('email');
    expect(parameters).toEqual(['person-1']);
  });

  it('rejects an empty person ID before querying D1', async () => {
    const db = {
      prepare: () => {
        throw new Error('must not query');
      },
    } as unknown as Pick<D1Database, 'prepare'>;
    await expect(listPublishedRecordsForPerson(db, '  ')).rejects.toThrow('Person ID is required');
  });
});
