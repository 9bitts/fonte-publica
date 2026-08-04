import { z } from 'zod';

export const buscaQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  municipio: z.string().trim().max(120).optional(),
  modalidade: z.coerce.number().int().min(1).max(13).optional(),
  situacao: z.coerce.number().int().min(1).max(4).optional(),
  valorMin: z.coerce.number().nonnegative().optional(),
  valorMax: z.coerce.number().nonnegative().optional(),
  de: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  ate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type BuscaQuery = z.infer<typeof buscaQuerySchema>;

export const pncpOrgaoSchema = z
  .object({
    cnpj: z.string(),
    razaoSocial: z.string().optional(),
    razaosocial: z.string().optional(),
    poderId: z.string().nullable().optional(),
    esferaId: z.string().nullable().optional(),
  })
  .passthrough();

export const pncpUnidadeSchema = z
  .object({
    codigoUnidade: z.string().optional(),
    nomeUnidade: z.string().optional(),
    codigoIbge: z.union([z.string(), z.number()]).nullable().optional(),
    municipioNome: z.string().nullable().optional(),
    ufSigla: z.string().nullable().optional(),
    ufNome: z.string().nullable().optional(),
  })
  .passthrough();

export const pncpContratacaoSchema = z
  .object({
    numeroControlePNCP: z.string(),
    numeroCompra: z.string().nullable().optional(),
    anoCompra: z.coerce.number(),
    processo: z.string().nullable().optional(),
    sequencialCompra: z.coerce.number().nullable().optional(),
    modalidadeId: z.coerce.number(),
    modalidadeNome: z.string().optional(),
    modoDisputaId: z.coerce.number().nullable().optional(),
    modoDisputaNome: z.string().nullable().optional(),
    situacaoCompraId: z.coerce.number(),
    situacaoCompraNome: z.string().optional(),
    objetoCompra: z.string().optional(),
    informacaoComplementar: z.string().nullable().optional(),
    srp: z.boolean().optional(),
    valorTotalEstimado: z.union([z.number(), z.string()]).nullable().optional(),
    valorTotalHomologado: z.union([z.number(), z.string()]).nullable().optional(),
    dataAberturaProposta: z.string().nullable().optional(),
    dataEncerramentoProposta: z.string().nullable().optional(),
    dataPublicacaoPncp: z.string().nullable().optional(),
    dataInclusao: z.string().nullable().optional(),
    dataAtualizacao: z.string().nullable().optional(),
    linkSistemaOrigem: z.string().nullable().optional(),
    usuarioNome: z.string().nullable().optional(),
    orgaoEntidade: pncpOrgaoSchema.optional(),
    unidadeOrgao: pncpUnidadeSchema.optional(),
  })
  .passthrough();

export type PncpContratacao = z.infer<typeof pncpContratacaoSchema>;

export const pncpPageSchema = z.object({
  data: z.array(z.unknown()).default([]),
  totalRegistros: z.coerce.number().optional(),
  totalPaginas: z.coerce.number().optional(),
  numeroPagina: z.coerce.number().optional(),
  paginasRestantes: z.coerce.number().optional(),
  empty: z.boolean().optional(),
});
