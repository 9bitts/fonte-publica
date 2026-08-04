import { describe, expect, it } from 'vitest';
import type { PncpContratacao } from '@/lib/validators';
import { onlyDigits, slugify } from '@/lib/format';

/**
 * Testa a lógica de chave natural / normalização usada no upsert,
 * sem depender de Postgres (idempotência de identidade).
 */
function naturalKey(item: Pick<PncpContratacao, 'numeroControlePNCP'>): string {
  return item.numeroControlePNCP;
}

function orgaoIdentity(item: PncpContratacao): { cnpj: string; slug: string } {
  const cnpj = onlyDigits(item.orgaoEntidade?.cnpj ?? '0').padStart(14, '0').slice(0, 14);
  const razao = item.orgaoEntidade?.razaoSocial || item.orgaoEntidade?.razaosocial || 'x';
  return { cnpj, slug: slugify(`${razao}-${cnpj.slice(-4)}`) };
}

describe('idempotência do upsert (chaves naturais)', () => {
  const sample: PncpContratacao = {
    numeroControlePNCP: '12345678000199-1-000042/2026',
    anoCompra: 2026,
    modalidadeId: 6,
    situacaoCompraId: 1,
    objetoCompra: 'Serviço de limpeza',
    orgaoEntidade: { cnpj: '12.345.678/0001-99', razaosocial: 'Prefeitura Teste' },
  };

  it('mesma contratação → mesma chave', () => {
    expect(naturalKey(sample)).toBe(naturalKey({ ...sample }));
  });

  it('CNPJ normalizado é estável entre formatos', () => {
    const a = orgaoIdentity(sample);
    const b = orgaoIdentity({
      ...sample,
      orgaoEntidade: { cnpj: '12345678000199', razaoSocial: 'Prefeitura Teste' },
    });
    expect(a.cnpj).toBe(b.cnpj);
    expect(a.cnpj).toBe('12345678000199');
  });

  it('slug de órgão é determinístico', () => {
    expect(orgaoIdentity(sample).slug).toBe('prefeitura-teste-0199');
  });
});
