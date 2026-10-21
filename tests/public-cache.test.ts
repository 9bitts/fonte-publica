import { describe, expect, it } from 'vitest';
import { isEdgeCacheablePath } from '@/lib/public-cache';

describe('isEdgeCacheablePath', () => {
  it('cacheia páginas públicas e a busca', () => {
    expect(isEdgeCacheablePath('/')).toBe(true);
    expect(isEdgeCacheablePath('/alertas')).toBe(true);
    expect(isEdgeCacheablePath('/busca')).toBe(true);
    expect(isEdgeCacheablePath('/contratacao/abc')).toBe(true);
    expect(isEdgeCacheablePath('/orgao/prefeitura')).toBe(true);
    expect(isEdgeCacheablePath('/municipio/salvador-ba')).toBe(true);
    expect(isEdgeCacheablePath('/uf/BA')).toBe(true);
  });

  it('não cacheia API, RSS nem sitemap', () => {
    expect(isEdgeCacheablePath('/api/contratacoes')).toBe(false);
    expect(isEdgeCacheablePath('/rss')).toBe(false);
    expect(isEdgeCacheablePath('/sitemap.xml')).toBe(false);
    expect(isEdgeCacheablePath('/contratacao')).toBe(false);
  });
});
