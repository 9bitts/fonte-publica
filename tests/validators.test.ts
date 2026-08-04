import { describe, expect, it } from 'vitest';
import { buscaQuerySchema, pncpContratacaoSchema } from '@/lib/validators';

describe('buscaQuerySchema', () => {
  it('aceita busca mínima', () => {
    const r = buscaQuerySchema.parse({ q: 'software' });
    expect(r.q).toBe('software');
    expect(r.limit).toBe(20);
  });

  it('normaliza UF e valida modalidade', () => {
    const r = buscaQuerySchema.parse({ uf: 'sp', modalidade: '6', valorMin: '1000' });
    expect(r.uf).toBe('SP');
    expect(r.modalidade).toBe(6);
    expect(r.valorMin).toBe(1000);
  });

  it('rejeita UF inválida', () => {
    expect(() => buscaQuerySchema.parse({ uf: 'SAO' })).toThrow();
  });
});

describe('pncpContratacaoSchema', () => {
  it('parseia payload mínimo do manual', () => {
    const r = pncpContratacaoSchema.parse({
      numeroControlePNCP: '00000000000191-1-000001/2026',
      anoCompra: 2026,
      modalidadeId: 6,
      situacaoCompraId: 1,
      objetoCompra: 'Aquisição de software',
      orgaoEntidade: { cnpj: '00000000000191', razaosocial: 'Órgão Exemplo' },
      unidadeOrgao: {
        codigoUnidade: '1',
        nomeUnidade: 'Sede',
        codigoIbge: 3550308,
        municipioNome: 'São Paulo',
        ufSigla: 'SP',
      },
      valorTotalEstimado: 1500.5,
    });
    expect(r.modalidadeId).toBe(6);
    expect(r.orgaoEntidade?.cnpj).toBe('00000000000191');
  });
});
