-- Full-text search (portuguese) over objetoCompra
-- Applied after Prisma migrate; safe to re-run.

ALTER TABLE "Contratacao"
  ADD COLUMN IF NOT EXISTS "objeto_tsv" tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce("objetoCompra", ''))) STORED;

CREATE INDEX IF NOT EXISTS "Contratacao_objeto_tsv_idx"
  ON "Contratacao" USING GIN ("objeto_tsv");
