import { describe, expect, it } from 'vitest';
import { encodeCursorForTest, buildWhereClausesForTest } from '@/lib/search-helpers';

describe('search query builder helpers', () => {
  it('codifica e decodifica cursor', () => {
    const encoded = encodeCursorForTest(new Date('2026-08-01T12:00:00.000Z'), 'abc');
    expect(encoded).toBeTruthy();
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      ts: string;
      id: string;
    };
    expect(decoded.id).toBe('abc');
    expect(decoded.ts).toContain('2026-08-01');
  });

  it('monta cláusulas a partir dos filtros', () => {
    const clauses = buildWhereClausesForTest({
      q: 'merenda',
      uf: 'SP',
      modalidade: 6,
      valorMin: 100n,
      valorMax: 50000n,
    });
    expect(clauses).toEqual(
      expect.arrayContaining(['fts', 'uf=SP', 'modalidade=6', 'valorMin', 'valorMax']),
    );
  });
});
