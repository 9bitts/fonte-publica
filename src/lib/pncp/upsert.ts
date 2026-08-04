import type { Prisma } from '@prisma/client';
import { UFS } from '../constants';
import { prisma } from '../db';
import {
  onlyDigits,
  parsePncpDate,
  reaisToCentavos,
  slugify,
} from '../format';
import type { PncpContratacao } from '../validators';

export type UpsertResult = {
  contratacaoId: string;
  created: boolean;
};

function razaoSocialOf(item: PncpContratacao): string {
  const o = item.orgaoEntidade;
  return o?.razaoSocial || o?.razaosocial || 'Órgão não informado';
}

function cnpjOf(item: PncpContratacao): string {
  return onlyDigits(item.orgaoEntidade?.cnpj ?? '00000000000000').padStart(14, '0').slice(0, 14);
}

/**
 * Upsert idempotente de uma contratação PNCP e entidades relacionadas.
 * Chave natural: numeroControlePNCP.
 */
export async function upsertContratacao(item: PncpContratacao): Promise<UpsertResult> {
  const cnpj = cnpjOf(item);
  const razao = razaoSocialOf(item);
  const ufSigla = item.unidadeOrgao?.ufSigla?.toUpperCase() ?? null;
  const ufNome =
    item.unidadeOrgao?.ufNome || (ufSigla ? UFS[ufSigla] : undefined) || ufSigla || 'Desconhecida';
  const codigoIbge = item.unidadeOrgao?.codigoIbge
    ? String(item.unidadeOrgao.codigoIbge)
    : null;
  const municipioNome = item.unidadeOrgao?.municipioNome ?? null;

  if (ufSigla && ufSigla.length === 2) {
    await prisma.uf.upsert({
      where: { sigla: ufSigla },
      create: { sigla: ufSigla, nome: ufNome },
      update: { nome: ufNome },
    });
  }

  let municipioId: string | null = null;
  if (codigoIbge && municipioNome && ufSigla) {
    const slug = slugify(`${municipioNome}-${ufSigla}`);
    const municipio = await prisma.municipio.upsert({
      where: { codigoIbge },
      create: {
        codigoIbge,
        nome: municipioNome,
        slug,
        ufSigla,
      },
      update: {
        nome: municipioNome,
        slug,
        ufSigla,
      },
    });
    municipioId = municipio.id;
  }

  const orgao = await prisma.orgao.upsert({
    where: { cnpj },
    create: {
      cnpj,
      razaoSocial: razao,
      slug: slugify(`${razao}-${cnpj.slice(-4)}`),
      poderId: item.orgaoEntidade?.poderId ?? null,
      esferaId: item.orgaoEntidade?.esferaId ?? null,
    },
    update: {
      razaoSocial: razao,
      poderId: item.orgaoEntidade?.poderId ?? null,
      esferaId: item.orgaoEntidade?.esferaId ?? null,
    },
  });

  let unidadeId: string | null = null;
  const codigoUnidade = item.unidadeOrgao?.codigoUnidade;
  if (codigoUnidade) {
    const unidade = await prisma.unidadeCompradora.upsert({
      where: {
        orgaoId_codigoUnidade: {
          orgaoId: orgao.id,
          codigoUnidade,
        },
      },
      create: {
        orgaoId: orgao.id,
        codigoUnidade,
        nomeUnidade: item.unidadeOrgao?.nomeUnidade ?? codigoUnidade,
        municipioId,
      },
      update: {
        nomeUnidade: item.unidadeOrgao?.nomeUnidade ?? codigoUnidade,
        municipioId,
      },
    });
    unidadeId = unidade.id;
  }

  const existing = await prisma.contratacao.findUnique({
    where: { numeroControlePNCP: item.numeroControlePNCP },
    select: { id: true },
  });

  const data: Prisma.ContratacaoUncheckedCreateInput = {
    numeroControlePNCP: item.numeroControlePNCP,
    numeroCompra: item.numeroCompra ?? null,
    anoCompra: item.anoCompra,
    processo: item.processo ?? null,
    sequencialCompra: item.sequencialCompra ?? null,
    modalidadeId: item.modalidadeId,
    modalidadeNome: item.modalidadeNome ?? `Modalidade ${item.modalidadeId}`,
    modoDisputaId: item.modoDisputaId ?? null,
    modoDisputaNome: item.modoDisputaNome ?? null,
    situacaoId: item.situacaoCompraId,
    situacaoNome: item.situacaoCompraNome ?? `Situação ${item.situacaoCompraId}`,
    objetoCompra: item.objetoCompra ?? '(sem objeto)',
    informacaoComplementar: item.informacaoComplementar ?? null,
    srp: item.srp ?? false,
    valorEstimado: reaisToCentavos(item.valorTotalEstimado),
    valorHomologado:
      item.valorTotalHomologado != null ? reaisToCentavos(item.valorTotalHomologado) : null,
    dataPublicacao: parsePncpDate(item.dataPublicacaoPncp),
    dataInclusao: parsePncpDate(item.dataInclusao),
    dataAtualizacao: parsePncpDate(item.dataAtualizacao),
    dataAberturaProposta: parsePncpDate(item.dataAberturaProposta),
    dataEncerramentoProposta: parsePncpDate(item.dataEncerramentoProposta),
    linkSistemaOrigem: item.linkSistemaOrigem ?? null,
    usuarioNome: item.usuarioNome ?? null,
    ufSigla,
    municipioCodigoIbge: codigoIbge,
    municipioNome,
    orgaoId: orgao.id,
    unidadeId,
  };

  const contratacao = await prisma.contratacao.upsert({
    where: { numeroControlePNCP: item.numeroControlePNCP },
    create: data,
    update: {
      numeroCompra: data.numeroCompra,
      processo: data.processo,
      modalidadeId: data.modalidadeId,
      modalidadeNome: data.modalidadeNome,
      modoDisputaId: data.modoDisputaId,
      modoDisputaNome: data.modoDisputaNome,
      situacaoId: data.situacaoId,
      situacaoNome: data.situacaoNome,
      objetoCompra: data.objetoCompra,
      informacaoComplementar: data.informacaoComplementar,
      srp: data.srp,
      valorEstimado: data.valorEstimado,
      valorHomologado: data.valorHomologado,
      dataPublicacao: data.dataPublicacao,
      dataInclusao: data.dataInclusao,
      dataAtualizacao: data.dataAtualizacao,
      dataAberturaProposta: data.dataAberturaProposta,
      dataEncerramentoProposta: data.dataEncerramentoProposta,
      linkSistemaOrigem: data.linkSistemaOrigem,
      usuarioNome: data.usuarioNome,
      ufSigla: data.ufSigla,
      municipioCodigoIbge: data.municipioCodigoIbge,
      municipioNome: data.municipioNome,
      orgaoId: data.orgaoId,
      unidadeId: data.unidadeId,
    },
  });

  return { contratacaoId: contratacao.id, created: !existing };
}
