import { afterEach, describe, expect, it } from 'vitest';
import { dbErrorMessage } from '@/lib/db-errors';
import { resolvePncpBaseUrl, safeHttpUrl } from '@/lib/security';
import { getSiteUrl } from '@/lib/site';

describe('safeHttpUrl', () => {
  it('aceita http e https', () => {
    expect(safeHttpUrl('https://exemplo.gov.br/x')).toBe('https://exemplo.gov.br/x');
    expect(safeHttpUrl('http://exemplo.gov.br/x')).toBe('http://exemplo.gov.br/x');
  });

  it('rejeita javascript e data', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,hi')).toBeNull();
    expect(safeHttpUrl('not a url')).toBeNull();
  });
});

describe('resolvePncpBaseUrl', () => {
  afterEach(() => {
    delete process.env.PNCP_BASE_URL;
  });

  it('usa default oficial', () => {
    expect(resolvePncpBaseUrl()).toBe('https://pncp.gov.br/api/consulta');
  });

  it('rejeita host estranho', () => {
    process.env.PNCP_BASE_URL = 'https://evil.example/api';
    expect(() => resolvePncpBaseUrl()).toThrow(/não permitido/);
  });
});

describe('getSiteUrl', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.RAILWAY_PUBLIC_DOMAIN;
  });

  it('prioriza NEXT_PUBLIC_SITE_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://fonte.example/';
    expect(getSiteUrl()).toBe('https://fonte.example');
  });

  it('em produção sem env não usa Host da request', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const req = new Request('http://localhost', {
      headers: { host: 'evil.attacker', 'x-forwarded-host': 'evil.attacker' },
    });
    expect(getSiteUrl(req)).toBe('https://fontepublica.org');
    process.env.NODE_ENV = prev;
  });
});

describe('dbErrorMessage', () => {
  it('não devolve stack/mensagem bruta desconhecida', () => {
    const msg = dbErrorMessage(new Error('relation "Secret" does not exist on host 10.0.0.1'));
    expect(msg).not.toMatch(/10\.0\.0\.1/);
    expect(msg.toLowerCase()).toMatch(/tabelas|banco|migrations/);
  });

  it('mensagem genérica para erro desconhecido', () => {
    expect(dbErrorMessage(new Error('weird internal xyz'))).toMatch(/tente novamente/i);
  });
});
