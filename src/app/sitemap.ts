import type { MetadataRoute } from 'next';
import { UFS } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000;

export async function generateSitemaps() {
  try {
    const total = await prisma.contratacao.count();
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return Array.from({ length: pages }, (_, i) => ({ id: i }));
  } catch {
    return [{ id: 0 }];
  }
}

export default async function sitemap(props: {
  id: Promise<number> | number;
}): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const id = typeof props.id === 'object' ? await props.id : props.id;
  const entries: MetadataRoute.Sitemap = [];

  if (id === 0) {
    entries.push(
      { url: site, changeFrequency: 'hourly', priority: 1 },
      { url: `${site}/busca`, changeFrequency: 'hourly', priority: 0.9 },
    );
    for (const sigla of Object.keys(UFS)) {
      entries.push({
        url: `${site}/uf/${sigla}`,
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }
  }

  try {
    const skip = id * PAGE_SIZE;
    const [contratacoes, orgaos, municipios] = await Promise.all([
      prisma.contratacao.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      id === 0
        ? prisma.orgao.findMany({ select: { slug: true, updatedAt: true }, take: 5000 })
        : Promise.resolve([]),
      id === 0
        ? prisma.municipio.findMany({ select: { slug: true, updatedAt: true }, take: 5000 })
        : Promise.resolve([]),
    ]);

    for (const c of contratacoes) {
      entries.push({
        url: `${site}/contratacao/${c.id}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
    for (const o of orgaos) {
      entries.push({
        url: `${site}/orgao/${o.slug}`,
        lastModified: o.updatedAt,
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }
    for (const m of municipios) {
      entries.push({
        url: `${site}/municipio/${m.slug}`,
        lastModified: m.updatedAt,
        changeFrequency: 'daily',
        priority: 0.65,
      });
    }
  } catch {
    // banco indisponível: sitemap mínimo
  }

  return entries;
}
