-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Uf" (
    "sigla" CHAR(2) NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Uf_pkey" PRIMARY KEY ("sigla")
);

-- CreateTable
CREATE TABLE "Municipio" (
    "id" TEXT NOT NULL,
    "codigoIbge" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ufSigla" CHAR(2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orgao" (
    "id" TEXT NOT NULL,
    "cnpj" VARCHAR(14) NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "poderId" VARCHAR(1),
    "esferaId" VARCHAR(1),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadeCompradora" (
    "id" TEXT NOT NULL,
    "codigoUnidade" TEXT NOT NULL,
    "nomeUnidade" TEXT NOT NULL,
    "orgaoId" TEXT NOT NULL,
    "municipioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnidadeCompradora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contratacao" (
    "id" TEXT NOT NULL,
    "numeroControlePNCP" TEXT NOT NULL,
    "numeroCompra" TEXT,
    "anoCompra" INTEGER NOT NULL,
    "processo" TEXT,
    "sequencialCompra" INTEGER,
    "modalidadeId" INTEGER NOT NULL,
    "modalidadeNome" TEXT NOT NULL,
    "modoDisputaId" INTEGER,
    "modoDisputaNome" TEXT,
    "situacaoId" INTEGER NOT NULL,
    "situacaoNome" TEXT NOT NULL,
    "objetoCompra" TEXT NOT NULL,
    "informacaoComplementar" TEXT,
    "srp" BOOLEAN NOT NULL DEFAULT false,
    "valorEstimado" BIGINT NOT NULL DEFAULT 0,
    "valorHomologado" BIGINT,
    "dataPublicacao" TIMESTAMP(3),
    "dataInclusao" TIMESTAMP(3),
    "dataAtualizacao" TIMESTAMP(3),
    "dataAberturaProposta" TIMESTAMP(3),
    "dataEncerramentoProposta" TIMESTAMP(3),
    "linkSistemaOrigem" TEXT,
    "usuarioNome" TEXT,
    "ufSigla" CHAR(2),
    "municipioCodigoIbge" TEXT,
    "municipioNome" TEXT,
    "orgaoId" TEXT NOT NULL,
    "unidadeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contratacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemContratacao" (
    "id" TEXT NOT NULL,
    "contratacaoId" TEXT NOT NULL,
    "numeroItem" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "materialOuServico" TEXT,
    "quantidade" DECIMAL(20,4),
    "valorUnitario" BIGINT,
    "valorTotal" BIGINT,
    "unidadeMedida" TEXT,
    "situacaoId" INTEGER,
    "situacaoNome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemContratacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "desde" TEXT,
    "ate" TEXT,
    "uf" TEXT,
    "modalidadeId" INTEGER,
    "paginaAtual" INTEGER NOT NULL DEFAULT 1,
    "totalPaginas" INTEGER,
    "totalRegistros" INTEGER,
    "processados" INTEGER NOT NULL DEFAULT 0,
    "upserted" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "checkpoint" JSONB,
    "mensagem" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_codigoIbge_key" ON "Municipio"("codigoIbge");
CREATE UNIQUE INDEX "Municipio_slug_key" ON "Municipio"("slug");
CREATE INDEX "Municipio_ufSigla_idx" ON "Municipio"("ufSigla");
CREATE INDEX "Municipio_nome_idx" ON "Municipio"("nome");

CREATE UNIQUE INDEX "Orgao_cnpj_key" ON "Orgao"("cnpj");
CREATE UNIQUE INDEX "Orgao_slug_key" ON "Orgao"("slug");
CREATE INDEX "Orgao_razaoSocial_idx" ON "Orgao"("razaoSocial");

CREATE INDEX "UnidadeCompradora_municipioId_idx" ON "UnidadeCompradora"("municipioId");
CREATE UNIQUE INDEX "UnidadeCompradora_orgaoId_codigoUnidade_key" ON "UnidadeCompradora"("orgaoId", "codigoUnidade");

CREATE UNIQUE INDEX "Contratacao_numeroControlePNCP_key" ON "Contratacao"("numeroControlePNCP");
CREATE INDEX "Contratacao_dataPublicacao_idx" ON "Contratacao"("dataPublicacao");
CREATE INDEX "Contratacao_dataAberturaProposta_idx" ON "Contratacao"("dataAberturaProposta");
CREATE INDEX "Contratacao_dataEncerramentoProposta_idx" ON "Contratacao"("dataEncerramentoProposta");
CREATE INDEX "Contratacao_ufSigla_idx" ON "Contratacao"("ufSigla");
CREATE INDEX "Contratacao_modalidadeId_idx" ON "Contratacao"("modalidadeId");
CREATE INDEX "Contratacao_situacaoId_idx" ON "Contratacao"("situacaoId");
CREATE INDEX "Contratacao_valorEstimado_idx" ON "Contratacao"("valorEstimado");
CREATE INDEX "Contratacao_orgaoId_idx" ON "Contratacao"("orgaoId");
CREATE INDEX "Contratacao_municipioCodigoIbge_idx" ON "Contratacao"("municipioCodigoIbge");
CREATE INDEX "Contratacao_anoCompra_idx" ON "Contratacao"("anoCompra");

CREATE INDEX "ItemContratacao_contratacaoId_idx" ON "ItemContratacao"("contratacaoId");
CREATE UNIQUE INDEX "ItemContratacao_contratacaoId_numeroItem_key" ON "ItemContratacao"("contratacaoId", "numeroItem");

CREATE INDEX "IngestRun_status_idx" ON "IngestRun"("status");
CREATE INDEX "IngestRun_startedAt_idx" ON "IngestRun"("startedAt");

-- AddForeignKey
ALTER TABLE "Municipio" ADD CONSTRAINT "Municipio_ufSigla_fkey" FOREIGN KEY ("ufSigla") REFERENCES "Uf"("sigla") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UnidadeCompradora" ADD CONSTRAINT "UnidadeCompradora_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "Orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UnidadeCompradora" ADD CONSTRAINT "UnidadeCompradora_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contratacao" ADD CONSTRAINT "Contratacao_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "Orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contratacao" ADD CONSTRAINT "Contratacao_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "UnidadeCompradora"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ItemContratacao" ADD CONSTRAINT "ItemContratacao_contratacaoId_fkey" FOREIGN KEY ("contratacaoId") REFERENCES "Contratacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
